import { UserRepository } from "@/domain/repositories/user-repository";
import { User } from "@/domain/entities/user";

// ⚠️ por ahora sin supabase real
export class SupabaseUserRepository implements UserRepository {
    async create(user: { email: string }): Promise<User> {
        // simulación temporal
        return {
            id: crypto.randomUUID(),
            email: user.email
        };
    }
}