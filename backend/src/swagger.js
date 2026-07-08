import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Board API',
      version: '1.0.0',
      description: '풀스택 게시판 과제 REST API (Auth / Posts / Comments)',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: '인증/회원' },
      { name: 'Posts', description: '게시글' },
      { name: 'Comments', description: '댓글' },
    ],
  },
  apis: ['./src/routes/*.js'],
});
