// async 컨트롤러의 에러를 자동으로 next(err) 로 전달하는 래퍼.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
