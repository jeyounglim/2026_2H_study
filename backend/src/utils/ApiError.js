// 컨트롤러/서비스에서 throw 하는 표준 에러.
// 공통 에러 핸들러가 statusCode 와 message 를 그대로 응답에 사용한다.
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const badRequest = (msg) => new ApiError(400, msg);
export const unauthorized = (msg = '인증이 필요합니다.') => new ApiError(401, msg);
export const forbidden = (msg = '권한이 없습니다.') => new ApiError(403, msg);
export const notFound = (msg = '리소스를 찾을 수 없습니다.') => new ApiError(404, msg);
export const conflict = (msg) => new ApiError(409, msg);
