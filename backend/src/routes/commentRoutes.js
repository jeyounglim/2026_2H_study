import { Router } from 'express';
import {
  deleteComment,
  toggleCommentLike,
  updateComment,
} from '../controllers/commentController.js';
import { authRequired } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { commentSchema } from '../validators/schemas.js';

const router = Router();

/**
 * @openapi
 * /comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: 댓글 수정 (본인만)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200: { description: 수정됨 }
 *       403: { description: 권한 없음 }
 */
router.put('/:id', authRequired, validateBody(commentSchema), updateComment);

/**
 * @openapi
 * /comments/{id}/like:
 *   post:
 *     tags: [Comments]
 *     summary: 댓글 추천 토글
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 추천/취소 결과 }
 *       401: { description: 인증 필요 }
 */
router.post('/:id/like', authRequired, toggleCommentLike);

/**
 * @openapi
 * /comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: 댓글 삭제 (본인만)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 삭제됨 }
 *       403: { description: 권한 없음 }
 */
router.delete('/:id', authRequired, deleteComment);

export default router;
