import { UserRepository } from "@/domain/repositories/user-repository";
import { MockUserRepository } from "../repositories/mock-user-repository";
import { SupabaseUserRepository } from "../repositories/supabase-user-repository";

class Container {
    private userRepository: UserRepository;

    constructor() {
        const appEnv = process.env.APP_ENV;

        const hasSupabase =
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (appEnv === "supabase" && hasSupabase) {
            this.userRepository = new SupabaseUserRepository();
        } else {
            this.userRepository = new MockUserRepository();
        }
    }

    getUserRepository(): UserRepository {
        return this.userRepository;
    }
}

export const container = new Container();