export function throwError(message) {
  const error = new Error();
  error.name = 'custom';
  error.message = message;
  throw error;
}