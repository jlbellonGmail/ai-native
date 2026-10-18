export type AIErrorType =
    | "CONTEXT_MISSING"
    | "AMBIGUOUS_REQUIREMENT"
    | "INVALID_PROMPT"
    | "ARCHITECTURE_VIOLATION"
    | "WORKFLOW_BREAK"
    | "AGENT_FAILURE"
    | "MCP_FAILURE"
    | "EXTERNAL_API_FAILURE"
    | "TIMEOUT"
    | "UNKNOWN";

export type AIErrorSeverity =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

export interface AIError {
    type: AIErrorType;
    message: string;
    context: Record<string, any>;
    severity: AIErrorSeverity;
    retryable: boolean;
    timestamp: string;
}
