import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, notFound } from '../utils/ApiError.js';
import { removeLocalUpload, uploadedPath } from '../middleware/upload.js';
import { postSchema } from '../validators/schemas.js';

const authorSelect = { id: true, nickname: true, profileImage: true, level: true };

const postInclude = {
  author: { select: authorSelect },
  images: { orderBy: { sortOrder: 'asc' } },
  _count: { select: { comments: true } },
};

const detailInclude = {
  author: { select: authorSelect },
  images: { orderBy: { sortOrder: 'asc' } },
};

function parsePostFields(body) {
  return postSchema.safeParse({
    title: body.title,
    content: body.content,
  });
}

function getUploadedFiles(req) {
  const files = req.files || {};
  const thumbnailFile = Array.isArray(files.thumbnail) ? files.thumbnail[0] : null;
  const imageFiles = Array.isArray(files.images) ? files.images : [];
  return { thumbnailFile, imageFiles };
}

function cleanupUploaded(req) {
  const { thumbnailFile, imageFiles } = getUploadedFiles(req);
  if (thumbnailFile) removeLocalUpload(uploadedPath(thumbnailFile));
  imageFiles.forEach((file) => removeLocalUpload(uploadedPath(file)));
}

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
      include: postInclude,
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

// GET /posts/popular?limit=5  (댓글 수 기준 인기글)
export const listPopularPosts = asyncHandler(async (req, res) => {
  const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));

  const posts = await prisma.post.findMany({
    take: limit,
    orderBy: [{ comments: { _count: 'desc' } }, { createdAt: 'desc' }],
    include: postInclude,
  });

  res.json({ data: posts });
});

// GET /posts/:id
export const getPost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!post) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }
  res.json({ data: post });
});

// POST /posts  (인증 필요, multipart 지원)
export const createPost = asyncHandler(async (req, res) => {
  const parsed = parsePostFields(req.body);
  if (!parsed.success) {
    cleanupUploaded(req);
    throw parsed.error;
  }

  const { title, content } = parsed.data;
  const { thumbnailFile, imageFiles } = getUploadedFiles(req);
  const thumbnail = thumbnailFile ? uploadedPath(thumbnailFile) : null;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      thumbnail,
      authorId: req.user.id,
      images: {
        create: imageFiles.map((file, index) => ({
          url: uploadedPath(file),
          sortOrder: index,
        })),
      },
    },
    include: detailInclude,
  });
  res.status(201).json({ message: '게시글이 작성되었습니다.', data: post });
});

// PUT /posts/:id  (본인만, multipart 지원)
export const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const parsed = parsePostFields(req.body);
  if (!parsed.success) {
    cleanupUploaded(req);
    throw parsed.error;
  }

  const { title, content } = parsed.data;
  const { thumbnailFile, imageFiles } = getUploadedFiles(req);

  const existing = await prisma.post.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!existing) {
    cleanupUploaded(req);
    throw notFound('게시글을 찾을 수 없습니다.');
  }
  if (existing.authorId !== req.user.id) {
    cleanupUploaded(req);
    throw forbidden('본인이 작성한 글만 수정할 수 있습니다.');
  }

  const thumbnail = thumbnailFile ? uploadedPath(thumbnailFile) : existing.thumbnail;
  const replaceImages = String(req.body.replaceImages || '') === 'true';

  const post = await prisma.$transaction(async (tx) => {
    if (replaceImages) {
      await tx.postImage.deleteMany({ where: { postId: id } });
      if (imageFiles.length) {
        await tx.postImage.createMany({
          data: imageFiles.map((file, index) => ({
            postId: id,
            url: uploadedPath(file),
            sortOrder: index,
          })),
        });
      }
    } else if (imageFiles.length) {
      const startOrder = existing.images.length;
      await tx.postImage.createMany({
        data: imageFiles.map((file, index) => ({
          postId: id,
          url: uploadedPath(file),
          sortOrder: startOrder + index,
        })),
      });
    }

    return tx.post.update({
      where: { id },
      data: { title, content, thumbnail },
      include: detailInclude,
    });
  });

  if (thumbnailFile && existing.thumbnail && existing.thumbnail !== thumbnail) {
    removeLocalUpload(existing.thumbnail);
  }
  if (replaceImages) {
    existing.images.forEach((image) => removeLocalUpload(image.url));
  }

  res.json({ message: '게시글이 수정되었습니다.', data: post });
});

// DELETE /posts/:id  (본인만)
export const deletePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.post.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!existing) {
    throw notFound('게시글을 찾을 수 없습니다.');
  }
  if (existing.authorId !== req.user.id) {
    throw forbidden('본인이 작성한 글만 삭제할 수 있습니다.');
  }

  await prisma.post.delete({ where: { id } });
  if (existing.thumbnail) removeLocalUpload(existing.thumbnail);
  existing.images.forEach((image) => removeLocalUpload(image.url));
  res.json({ message: '게시글이 삭제되었습니다.' });
});
