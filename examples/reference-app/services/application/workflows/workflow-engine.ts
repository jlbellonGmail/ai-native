import { Workflow } from "./workflow-types";
import { Logger } from "@/infrastructure/observability/logger";

export class WorkflowEngine {

    static async run(workflow: Workflow, initialContext: any = {}) {

        let context = { ...initialContext };

        Logger.info("Workflow started", { workflow: workflow.name });

        for (const step of workflow.steps) {
            try {

                Logger.info("Step: " + (step.name || "anonymous"), {});

                context = await step(context);

            } catch (error: any) {

                Logger.error("Workflow failed", {
                    workflow: workflow.name,
                    step: step.name || "anonymous",
                    message: error.message
                });

                throw error;
            }
        }

        Logger.info("Workflow finished", { workflow: workflow.name });

        return context;
    }
}