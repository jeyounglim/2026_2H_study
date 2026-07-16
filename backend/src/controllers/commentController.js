import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound } from '../utils/ApiError.js';

const authorSelect = { id: true, nickname: true, profileImage: true };

const commentInclude = {
  author: { select: authorSelect },
  replies: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: authorSelect } },
  },
};

// GET /posts/:postId/comments
export const listComments = asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }

  // 최상위 댓글만 조회하고, 1단계 대댓글은 replies 로 포함
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: 'asc' },
    include: commentInclude,
  });
  res.json({ data: comments });
});

// POST /posts/:postId/comments  (인증 필요)
export const createComment = asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const { content, parentId } = req.body;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }

  let resolvedParentId = null;
  if (parentId != null) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) {
      throw badRequest('답글 대상 댓글을 찾을 수 없습니다.');
    }
    // 1단계만 허용: 대댓글에는 다시 답글 불가
    if (parent.parentId != null) {
      throw badRequest('대댓글에는 답글을 달 수 없습니다.');
    }
    resolvedParentId = parent.id;
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: req.user.id,
      parentId: resolvedParentId,
      updatedAt: new Date(),
    },
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

  // 부모 댓글 삭제 시 대댓글도 Cascade 로 함께 삭제됨
  await prisma.comment.delete({ where: { id } });
  res.json({ message: '댓글이 삭제되었습니다.' });
});
