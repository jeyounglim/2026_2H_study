import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// JWT payload 에는 사용자 식별에 필요한 최소 정보만 담는다.
// (비밀번호 등 민감 정보는 포함하지 않는다.)
export function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
