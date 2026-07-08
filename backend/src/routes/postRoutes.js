import { Router } from 'express';
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { listComments, createComment } from '../controllers/commentController.js';
import { authRequired } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { postSchema, commentSchema } from '../validators/schemas.js';

const router = Router();

/**
 * @openapi
 * /posts:
 *   get:
 *     tags: [Posts]
 *     summary: 게시글 목록 조회 (페이징 / 검색)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: 게시글 목록 + pagination }
 */
router.get('/', listPosts);

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: 게시글 상세 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 게시글 상세 }
 *       404: { description: 없음 }
 */
router.get('/:id', getPost);

/**
 * @openapi
 * /posts:
 *   post:
 *     tags: [Posts]
 *     summary: 게시글 작성 (로그인 필요)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       201: { description: 작성됨 }
 *       401: { description: 인증 필요 }
 */
router.post('/', authRequired, validateBody(postSchema), createPost);

/**
 * @openapi
 * /posts/{id}:
 *   put:
 *     tags: [Posts]
 *     summary: 게시글 수정 (본인만)
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
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200: { description: 수정됨 }
 *       403: { description: 권한 없음 }
 */
router.put('/:id', authRequired, validateBody(postSchema), updatePost);

/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     summary: 게시글 삭제 (본인만)
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
router.delete('/:id', authRequired, deletePost);

/**
 * @openapi
 * /posts/{postId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: 게시글의 댓글 목록 조회
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 댓글 목록 }
 */
router.get('/:postId/comments', listComments);

/**
 * @openapi
 * /posts/{postId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: 댓글 작성 (로그인 필요)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: postId
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
 *       201: { description: 작성됨 }
 *       401: { description: 인증 필요 }
 */
router.post('/:postId/comments', authRequired, validateBody(commentSchema), createComment);

export default router;
