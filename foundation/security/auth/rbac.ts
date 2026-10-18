export class RoleBasedAccessControl {
    private roles: Map<string, string[]> = new Map([
        ['admin', ['read', 'write', 'deploy']],
        ['developer', ['read', 'write']],
        ['agent', ['read']]
    ]);

    canPerform(role: string, action: string): boolean {
        const permissions = this.roles.get(role);
        return permissions ? permissions.includes(action) : false;
    }
}
