export interface Author {
  id: number;
  nickname: string;
  profileImage?: string | null;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail?: string | null;
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
