import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.').max(20),
});

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

export const postSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(255),
  content: z.string().min(1, '내용을 입력하세요.'),
});

export const commentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력하세요.'),
});
