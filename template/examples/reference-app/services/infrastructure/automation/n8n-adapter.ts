export class N8nAutomationAdapter {
    private webhookUrl = process.env.N8N_WEBHOOK_URL;

    async triggerEvent(eventName: string, payload: any) {
        // Normalize First Pattern: Limpiar datos antes de enviar [11]
        const normalizedData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data: payload,
            environment: process.env.NODE_ENV
        };

        return fetch(this.webhookUrl!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedData)
        });
    }
}