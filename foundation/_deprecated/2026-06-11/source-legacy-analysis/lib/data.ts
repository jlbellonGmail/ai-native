export async function getAuditData() {
    const history = await fetch("/ai-audit-history.json")
        .then(r => r.json())
        .catch(() => []);

    const result = await fetch("/ai-audit-result.json")
        .then(r => r.json())
        .catch(() => ({}));

    return { history, result };
}