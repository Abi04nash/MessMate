export function sendSuccess(res, { statusCode = 200, message = "Operation completed successfully", data, meta } = {}) {
  if (statusCode === 204) return res.status(204).send();
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}