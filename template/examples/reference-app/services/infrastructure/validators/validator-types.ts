export interface ValidationResult {
    rule: string;
    success: boolean;
    message?: string;
}

export type Validator = () => Promise<ValidationResult>;