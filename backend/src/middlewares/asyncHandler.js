/**
 * Wraps an async Express route handler.
 * Any thrown error (AppError subclass OR unexpected Error)
 * is forwarded to the global error middleware via next(err).
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req,res,next)).catch(next)
};

export default asyncHandler;