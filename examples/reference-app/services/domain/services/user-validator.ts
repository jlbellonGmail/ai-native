import { AppError } from "@/domain/errors/app-error";

export function validateUserEmail(email: string) {

    if (!email) {
        throw new AppError({
            message: "Email is required",
            code: "INVALID_INPUT",
            statusCode: 400,
            retryable: false
        });
    }

    // regex simple pero efectiva (no ultra estricta)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new AppError({
            message: "Invalid email format",
            code: "INVALID_INPUT",
            statusCode: 400,
            retryable: false
        });
    }

}