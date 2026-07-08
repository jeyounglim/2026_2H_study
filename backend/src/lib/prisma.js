import { PrismaClient } from '@prisma/client';

// 개발 중 --watch 재시작 시 커넥션이 계속 늘어나는 것을 방지하기 위해
// globalThis 에 인스턴스를 캐싱한다.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
