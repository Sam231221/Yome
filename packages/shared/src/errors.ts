export function createHttpError(message: string, statusCode = 400): Error & {
  statusCode: number;
} {
  return Object.assign(new Error(message), { statusCode });
}
