import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, notFound } from '../utils/ApiError.js';

const authorSelect = { id: true, nickname: true, profileImage: true };

// GET /posts?page=1&limit=10  (페이징)
export const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = (req.query.search || '').toString().trim();
  const authorId = Number(req.query.authorId);
  const where = {
    ...(search
      ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] }
      : {}),
    ...(Number.isInteger(authorId) && authorId > 0 ? { authorId } : {}),
  };
  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: authorSelect },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  res.json({
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: skip + posts.length < total,
    },
  });
});

// GET /posts/:id
export const getPost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: authorSelect } },
  });
  if (!post) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }
  res.json({ data: post });
});

// POST /posts  (인증 필요)
export const createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const post = await prisma.post.create({
    data: { title, content, authorId: req.user.id },
    include: { author: { select: authorSelect } },
  });
  res.status(201).json({ message: '게시글이 작성되었습니다.', data: post });
});

// PUT /posts/:id  (본인만)
export const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { title, content } = req.body;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }
  if (existing.authorId !== req.user.id) {
    throw forbidden('본인이 작성한 글만 수정할 수 있습니다.');
  }

  const post = await prisma.post.update({
    where: { id },
    data: { title, content },
    include: { author: { select: authorSelect } },
  });
  res.json({ message: '게시글이 수정되었습니다.', data: post });
});

// DELETE /posts/:id  (본인만)
export const deletePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }
  if (existing.authorId !== req.user.id) {
    throw forbidden('본인이 작성한 글만 삭제할 수 있습니다.');
  }

  await prisma.post.delete({ where: { id } });
  res.json({ message: '게시글이 삭제되었습니다.' });
});
