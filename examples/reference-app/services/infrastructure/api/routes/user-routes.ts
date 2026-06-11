// src/infrastructure/api/routes/user.routes.ts
import { Router } from "express";

const router = Router();

import { createUser } from "../../controllers/user-controller";

router.post("/users", createUser);  