export class AppError extends Error {
    constructor(message, statuscode){
        super(message);
        this.statusCode = statuscode
    }
}

/**
 * 400 - malformed input, failed validation, bad arguments
 */
export class BadRequestError extends AppError{
    constructor(message = 'Bad Request'){
        super(message,400);
    }
}

/**
 * 401 - missing/invalid token, not logged in
 */
export class UnauthorizedError extends AppError{
    constructor(message = "Authentication Required"){
        super(message, 401);
    }
}

/**
 * 403 - logged in but not allowed to perform this operation
 */
export class ForbiddenError extends AppError{
    constructor(message = "You do not have permission to perform this action."){
        super(message, 403);
    }
}

/**
 * 404 - resource does not exist.
 */
export class NotFoundError extends AppError{
    constructor(message = "Resource not found."){
        super(message, 404);
    }
}

/**
 * 409 - conflict, e.g: duplicate email / project name
 */
export class ConflictError extends AppError{
    constructor(message = "Conflict with existing resource"){
        super(message, 409);
    }
}

/**
 * 429 - too many requests.
 */
export class TooManyRequestsError extends AppError{
    constructor(message = "Too many requests. Please try again later."){
        super(message, 401);
    }
}

