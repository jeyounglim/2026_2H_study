import multer from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

// 404 (매칭되는 라우트 없음)
export function notFoundHandler(req, res) {
  res.status(404).json({ message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}` });
}

// 공통 에러 핸들러 - 모든 에러를 { message } (필요 시 errors) 형태로 통일.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: '입력값이 올바르지 않습니다.',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '이미지 크기는 2MB 이하여야 합니다.' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Prisma unique 제약 위반 등
  if (err?.code === 'P2002') {
    return res.status(409).json({ message: '이미 존재하는 값입니다.' });
  }

  console.error('[UNHANDLED ERROR]', err);
  return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
}
