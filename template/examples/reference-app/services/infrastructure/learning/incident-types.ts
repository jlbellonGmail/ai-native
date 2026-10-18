export interface Incident {
    message: string;
    stack?: string;
    timestamp: string;
    type: "validation" | "runtime" | "business" | "unknown";
}