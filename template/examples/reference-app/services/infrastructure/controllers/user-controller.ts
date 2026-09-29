import { Request, Response } from "express";
import { errorResponse } from "../api/api-response";

export async function createUser(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json(
            errorResponse("INVALID_INPUT", "Email is required")
        );
    }

    // llamar al caso de uso acá
}