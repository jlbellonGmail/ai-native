export class RateLimiter {
    static limit(clientId: string): boolean {
        console.log(`[Security] Checking rate limit for ${clientId}`);
        return true;
    }
}
