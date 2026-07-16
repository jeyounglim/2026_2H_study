import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { badRequest } from '../utils/ApiError.js';

const avatarDir = path.resolve('uploads/avatars');
const thumbnailDir = path.resolve('uploads/thumbnails');
fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(thumbnailDir, { recursive: true });

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
        cb(null, `${prefix}-${userId}-${Date.now()}${ext}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
}

export const avatarUpload = createImageUpload({ dir: avatarDir, prefix: 'user' });
export const thumbnailUpload = createImageUpload({ dir: thumbnailDir, prefix: 'post' });

export function removeLocalUpload(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const absolute = path.resolve(`.${fileUrl}`);
  fs.promises.unlink(absolute).catch(() => {});
}
