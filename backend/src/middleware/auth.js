import { verifyAccessToken } from '../lib/jwt.js';
import { unauthorized } from '../utils/ApiError.js';

// Authorization: Bearer <token> 헤더를 검증하고 req.user 를 채운다.
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('인증 토큰이 필요합니다.'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, email: payload.email };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(unauthorized('토큰이 만료되었습니다.'));
    }
    return next(unauthorized('유효하지 않은 토큰입니다.'));
  }
}
