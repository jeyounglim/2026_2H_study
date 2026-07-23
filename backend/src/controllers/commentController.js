import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound } from '../utils/ApiError.js';

const authorSelect = { id: true, nickname: true, profileImage: true, level: true };

const likeInclude = {
  author: { select: authorSelect },
  _count: { select: { likes: true } },
  likes: { select: { userId: true } },
};

const commentInclude = {
  ...likeInclude,
  replies: {
    orderBy: { createdAt: 'asc' },
    include: likeInclude,
  },
};

function mapComment(comment, viewerId) {
  const { likes, _count, replies, ...rest } = comment;
  return {
    ...rest,
    likeCount: _count?.likes ?? 0,
    likedByMe: viewerId ? (likes?.some((like) => like.userId === viewerId) ?? false) : false,
    replies: Array.isArray(replies)
      ? replies.map((reply) => mapComment(reply, viewerId))
      : undefined,
  };
}

// GET /posts/:postId/comments
export const listComments = asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const viewerId = req.user?.id ?? null;

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
  res.json({ data: comments.map((comment) => mapComment(comment, viewerId)) });
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
    include: likeInclude,
  });
  res.status(201).json({
    message: '댓글이 작성되었습니다.',
    data: mapComment(comment, req.user.id),
  });
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
    include: likeInclude,
  });
  res.json({
    message: '댓글이 수정되었습니다.',
    data: mapComment(comment, req.user.id),
  });
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

// POST /comments/:id/like  (로그인 필요, 토글)
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    throw notFound('댓글을 찾을 수 없습니다.');
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: id, userId } },
  });

  let liked = false;
  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.commentLike.create({ data: { commentId: id, userId } });
    liked = true;
  }

  const likeCount = await prisma.commentLike.count({ where: { commentId: id } });
  res.json({
    message: liked ? '추천했습니다.' : '추천을 취소했습니다.',
    data: { commentId: id, liked, likeCount },
  });
});
