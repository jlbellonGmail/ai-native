export type WorkflowContext = Record<string, any>;

export type WorkflowStep = (context: WorkflowContext) => Promise<WorkflowContext>;

export interface Workflow {
    name: string;
    steps: WorkflowStep[];
}