import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, notFound } from '../utils/ApiError.js';

const authorSelect = { id: true, nickname: true };

// GET /posts/:postId/comments
export const listComments = asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: authorSelect } },
  });
  res.json({ data: comments });
});

// POST /posts/:postId/comments  (인증 필요)
export const createComment = asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const { content } = req.body;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }

  const comment = await prisma.comment.create({
    data: { content, postId, authorId: req.user.id, updatedAt: new Date() },
    include: { author: { select: authorSelect } },
  });
  res.status(201).json({ message: '댓글이 작성되었습니다.', data: comment });
});

// PUT /comments/:id  (본인만)
export const updateComment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { content } = req.body;

  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('댓글을 찾을 수 없습니다.');
  }
  if (existing.authorId !== req.user.id) {
    throw forbidden('본인이 작성한 댓글만 수정할 수 있습니다.');
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: { content },
    include: { author: { select: authorSelect } },
  });
  res.json({ message: '댓글이 수정되었습니다.', data: comment });
});

// DELETE /comments/:id  (본인만)
export const deleteComment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('댓글을 찾을 수 없습니다.');
  }
  if (existing.authorId !== req.user.id) {
    throw forbidden('본인이 작성한 댓글만 삭제할 수 있습니다.');
  }

  await prisma.comment.delete({ where: { id } });
  res.json({ message: '댓글이 삭제되었습니다.' });
});
