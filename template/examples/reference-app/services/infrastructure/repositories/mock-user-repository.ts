import { UserRepository } from "@/domain/repositories/user-repository";
import { User } from "@/domain/entities/user";

export class MockUserRepository implements UserRepository {
    async create(user: { email: string }): Promise<User> {
        return {
            id: crypto.randomUUID(),
            email: user.email
        };
    }
}