// @ts-ignore
import { NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/infrastructure/api/api-response";

export async function POST(request: Request) {
    const body = await request.json();
    const { email } = body;

    if (!email) {
        return NextResponse.json(
            errorResponse("INVALID_INPUT", "Email is required"),
            { status: 400 }
        );
    }

    // Simulación de creación
    const user = { id: "1", email };

    return NextResponse.json(
        successResponse(user),
        { status: 201 }
    );
}