import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { badRequest } from '../utils/ApiError.js';

const avatarDir = path.resolve('uploads/avatars');
const thumbnailDir = path.resolve('uploads/thumbnails');
const contentDir = path.resolve('uploads/content');
fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(thumbnailDir, { recursive: true });
fs.mkdirSync(contentDir, { recursive: true });

function imageFileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(badRequest('이미지 파일(jpg, png, webp, gif)만 업로드할 수 있습니다.'));
  }
  return cb(null, true);
}

function createImageUpload({ dir, prefix }) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, dir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const userId = req.user?.id ?? 'anon';
        cb(null, `${prefix}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
}

const postMediaStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'thumbnail') return cb(null, thumbnailDir);
    return cb(null, contentDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const userId = req.user?.id ?? 'anon';
    const prefix = file.fieldname === 'thumbnail' ? 'thumb' : 'content';
    cb(null, `${prefix}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

export const avatarUpload = createImageUpload({ dir: avatarDir, prefix: 'user' });
export const thumbnailUpload = createImageUpload({ dir: thumbnailDir, prefix: 'post' });

// 썸네일 1장 + 본문 이미지 여러 장
export const postMediaUpload = multer({
  storage: postMediaStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 11 },
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

export function removeLocalUpload(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const absolute = path.resolve(`.${fileUrl}`);
  fs.promises.unlink(absolute).catch(() => {});
}

export function uploadedPath(file) {
  if (!file) return null;
  if (file.fieldname === 'thumbnail') return `/uploads/thumbnails/${file.filename}`;
  return `/uploads/content/${file.filename}`;
}
