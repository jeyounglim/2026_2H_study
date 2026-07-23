export type UserLevel = 'JUNIOR' | 'SENIOR';

export interface Author {
  id: number;
  nickname: string;
  level?: UserLevel | string | null;
  profileImage?: string | null;
}

export interface PostImage {
  id: number;
  postId?: number;
  url: string;
  sortOrder: number;
  createdAt?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail?: string | null;
  images?: PostImage[];
  authorId: number;
  author: Author;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number };
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  parentId?: number | null;
  author: Author;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  replies?: Comment[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}
