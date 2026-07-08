import { Router } from 'express';
import { register, verifyEmail, login, me } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 회원가입 (이메일 중복검사 + bcrypt 암호화 + 이메일 인증 발송)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nickname]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               nickname: { type: string }
 *     responses:
 *       201: { description: 가입 성공 }
 *       409: { description: 이메일 중복 }
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @openapi
 * /auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: 이메일 인증 (가입 시 발급된 토큰으로 계정 활성화)
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: 인증 완료 }
 *       400: { description: 유효하지 않거나 만료된 토큰 }
 */
router.get('/verify-email', verifyEmail);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 로그인 (성공 시 JWT 발급)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: 로그인 성공, JWT 반환 }
 *       401: { description: 인증 실패 }
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 현재 로그인 사용자 정보 조회
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 사용자 정보 }
 *       401: { description: 인증 필요 }
 */
router.get('/me', authRequired, me);

export default router;
