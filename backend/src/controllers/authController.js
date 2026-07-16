import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signAccessToken } from '../lib/jwt.js';
import { sendVerificationEmail } from '../lib/mailer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, notFound, unauthorized } from '../utils/ApiError.js';

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  profileImage: user.profileImage,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

function removeLocalUpload(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const absolute = path.resolve(`.${fileUrl}`);
  fs.promises.unlink(absolute).catch(() => {});
}

// POST /auth/register
export const register = asyncHandler(async (req, res) => {
  const { email, password, nickname } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw conflict('이미 사용 중인 이메일입니다.');
  }

  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: { email, password: hashed, nickname, verifyToken, verifyTokenExpiry },
  });

  const { delivered, verifyUrl } = await sendVerificationEmail(email, verifyToken);

  res.status(201).json({
    message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
    user: publicUser(user),
    // SMTP 미설정(개발 환경)일 때만 인증 링크를 응답에 포함해 편의 제공
    emailDelivered: delivered,
    ...(delivered ? {} : { verifyUrl }),
  });
});

// GET /auth/verify-email?token=...
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    throw badRequest('인증 토큰이 필요합니다.');
  }

  const user = await prisma.user.findFirst({ where: { verifyToken: String(token) } });
  if (!user) {
    throw badRequest('유효하지 않은 인증 토큰입니다.');
  }
  if (user.isVerified) {
    return res.json({ message: '이미 인증된 계정입니다.' });
  }
  if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
    throw badRequest('인증 토큰이 만료되었습니다. 다시 가입 또는 재발송이 필요합니다.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null, verifyTokenExpiry: null },
  });

  res.json({ message: '이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.' });
});

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw unauthorized('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw unauthorized('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  if (!user.isVerified) {
    throw unauthorized('이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.');
  }

  const token = signAccessToken(user);
  res.json({ message: '로그인 성공', token, user: publicUser(user) });
});

// GET /auth/me  (인증 필요)
export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw notFound('사용자를 찾을 수 없습니다.');
  }
  res.json({ user: publicUser(user) });
});

// POST /auth/profile-image  (인증 필요, multipart)
export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw badRequest('이미지 파일을 선택해주세요.');
  }

  const profileImage = `/uploads/avatars/${req.file.filename}`;
  const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existing) {
    removeLocalUpload(profileImage);
    throw notFound('사용자를 찾을 수 없습니다.');
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage },
  });

  if (existing.profileImage && existing.profileImage !== profileImage) {
    removeLocalUpload(existing.profileImage);
  }

  res.json({ message: '프로필 이미지가 등록되었습니다.', user: publicUser(user) });
});

// PATCH /auth/me  (닉네임 수정)
export const updateProfile = asyncHandler(async (req, res) => {
  const { nickname } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { nickname },
  });

  res.json({ message: '프로필이 수정되었습니다.', user: publicUser(user) });
});

// PATCH /auth/password  (비밀번호 변경)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existing) {
    throw notFound('사용자를 찾을 수 없습니다.');
  }

  const ok = await bcrypt.compare(currentPassword, existing.password);
  if (!ok) {
    throw badRequest('현재 비밀번호가 올바르지 않습니다.');
  }

  if (currentPassword === newPassword) {
    throw badRequest('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed },
  });

  res.json({ message: '비밀번호가 변경되었습니다.' });
});
