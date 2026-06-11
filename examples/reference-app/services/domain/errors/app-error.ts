export type ErrorCode =
    | "INVALID_INPUT"
    | "NOT_FOUND"
    | "INTERNAL_ERROR"
    | "EXTERNAL_ERROR";

export class AppError extends Error {
    code: ErrorCode;
    statusCode: number;
    retryable: boolean;

    constructor(params: {
        message: string;
        code: ErrorCode;
        statusCode?: number;
        retryable?: boolean;
    }) {
        super(params.message);

        this.code = params.code;
        this.statusCode = params.statusCode || 500;
        this.retryable = params.retryable || false;
    }
}