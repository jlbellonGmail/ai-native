import { AutomationProvider } from "../../../domain/ports/automation-provider-port";

export class N8nWebhookAdapter implements AutomationProvider {
    private readonly webhook_url: string = process.env.N8N_WEBHOOK_URL || '';

    async send_event(event_name: string, payload: Record<string, any>): Promise<void> {
        if (!this.webhook_url) {
            console.warn("⚠️ N8N_WEBHOOK_URL no configurada.");
            return;
        }

        const response = await fetch(this.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: event_name,
                timestamp: new Date().toISOString(),
                data: payload
            })
        });

        if (!response.ok) {
            throw new Error(`Error en n8n: ${response.statusText}`);
        }
    }
}