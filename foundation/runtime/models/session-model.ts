export interface AISession {
    id: string;
    startTime: string;
    endTime?: string;
    status: "RUNNING" | "COMPLETED" | "FAILED";
    metadata?: Record<string, any>;
}