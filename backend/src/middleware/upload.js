import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { badRequest } from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads/avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const userId = req.user?.id ?? 'anon';
    cb(null, `user-${userId}-${Date.now()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(badRequest('이미지 파일(jpg, png, webp, gif)만 업로드할 수 있습니다.'));
  }
  return cb(null, true);
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
