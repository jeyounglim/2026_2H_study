// zod 스키마로 요청 body 를 검증하고, 통과한 값을 req.body 에 재할당한다.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  req.body = result.data;
  return next();
};
