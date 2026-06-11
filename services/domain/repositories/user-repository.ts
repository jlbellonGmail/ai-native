import { User } from "../entities/user";

export interface UserRepository {
    create(user: { email: string }): Promise<User>;
}