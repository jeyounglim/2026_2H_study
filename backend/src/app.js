import express from 'express';
import cors from 'cors';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env.js';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve('uploads')));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Swagger 문서
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

  // API 라우트
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/comments', commentRoutes);

  // 에러 핸들링
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
