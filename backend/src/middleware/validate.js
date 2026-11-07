import { ApiError } from "../utils/ApiError.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return next(new ApiError(
        422,
        "Validation failed",
        parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message
        }))
      ));
    }
    req[source] = parsed.data;
    next();
  };
}