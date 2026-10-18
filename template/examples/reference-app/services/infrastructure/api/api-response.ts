export interface ApiError {
    code: string;
    message: string;
}

export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
    meta?: Record<string, any>;
}

export function successResponse<T>(data: T): ApiResponse<T> {
    return {
        data,
        error: null
    };
}

export function errorResponse(code: string, message: string): ApiResponse<null> {
    return {
        data: null,
        error: {
            code,
            message
        }
    };
}