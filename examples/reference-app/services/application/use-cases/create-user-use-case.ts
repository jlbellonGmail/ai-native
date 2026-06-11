import { validateUserEmail } from "@/domain/services/user-validator";
import { User } from "@/domain/entities/user";
import { UserRepository } from "@/domain/repositories/user-repository";
import { AppError } from "@/domain/errors/app-error";

export async function createUserUseCase(
    input: { email: string },
    userRepository: UserRepository
): Promise<User> {

    if (!input.email) {
        throw new AppError({
            message: "Email is required",
            code: "INVALID_INPUT",
            statusCode: 400,
            retryable: false
        });
    }

    validateUserEmail(input.email);

    const user = await userRepository.create({
        email: input.email
    });

    return user;
}