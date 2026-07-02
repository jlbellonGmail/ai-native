export interface AutomationProvider {
    send_event(event_name: string, payload: Record<string, any>): Promise<void>;
}