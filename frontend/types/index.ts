export interface Author {
  id: number;
  nickname: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
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
  author: Author;
  createdAt: string;
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
