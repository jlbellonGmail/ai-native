// @ts-ignore
import { NextResponse } from "next/server";
import { createUserOrchestrator } from "@/application/orchestrators/create-user-orchestrator";
import { errorResponse, successResponse } from "@/infrastructure/api/api-response";
import { container } from "@/infrastructure/di/container";
import { Logger } from "@/infrastructure/observability/logger";
import { RequestContext } from "@/infrastructure/observability/request-context";
import { AppError } from "@/domain/errors/app-error";
import { IncidentLogger } from "@/infrastructure/observability/incident-logger";

function generateRequestId() {
    return `req_${Math.random().toString(36).substring(2, 10)}`;
}

export async function POST(request: Request) {
    const requestId = generateRequestId();

    return RequestContext.run(requestId, async () => {
        try {
            const body = await request.json();
            const { email } = body;

            Logger.info("Create user request received", { email });

            const userRepository = container.getUserRepository();

            const user = await createUserOrchestrator(
                { email },
                userRepository
            );

            Logger.info("User created successfully", { email });

            return NextResponse.json(
                successResponse(user),
                { status: 201 }
            );

        } catch (error: any) {
            if (error.code === "INVALID_INPUT") {
                return NextResponse.json(
                    errorResponse("INVALID_INPUT", error.message),
                    { status: 400 }
                );
            }

            return NextResponse.json(
                errorResponse("INTERNAL_ERROR", "Unexpected error"),
                { status: 500 }
            );
        }
    });
}