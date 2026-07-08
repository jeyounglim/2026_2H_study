import { Router } from 'express';
import { deleteComment } from '../controllers/commentController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

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
