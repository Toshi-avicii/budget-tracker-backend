export class CustomError extends Error {
    statusCode = 500; // default error status code
    constructor(message: string, statusCode?: number) {
        super(message); // taking message from the Error class
        this.name = this.constructor.name; // name of the error
        this.statusCode = statusCode || 500; // status code of the error
        Error.captureStackTrace(this, this.constructor); // capture stack of the error
    }
}

export class ValidationError extends CustomError {
    constructor(message: string) {
        super(message, 400); // 400 bad request
    }
}

export class AuthenticationError extends CustomError {
    constructor(message: string) {
        super(message, 401); // unauthorized
    }
}

export class ForbiddenError extends CustomError {
    constructor(message: string) {
        super(message, 403)
    }
}

export class NotFoundError extends CustomError {
    constructor(message: string) {
        super(message, 404); // not found error
    }
}

export class DatabaseError extends CustomError {
    constructor(message: string) {
        super(message, 503)
    }
}

export class InternalServerError extends CustomError {
    constructor(message: string) {
        super(message, 500);
    }
}

type FieldErrorObj = { message: string, type: string, errors: string[] }
export class FieldError extends Error {
    error = {}
    constructor(error: FieldErrorObj) {
        super(error.message);
        this.name = this.constructor.name; // name of the error
        Error.captureStackTrace(this, this.constructor);
        this.error = {
            type: error.type,
            errors: error.errors
        };
    }
}