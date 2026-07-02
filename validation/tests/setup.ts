import { beforeAll, afterAll, vi } from 'vitest';

/**
 * Configuración global para el entorno de pruebas GI 12/10.
 */
beforeAll(() => {
    // Forzamos el entorno usando casting para evitar el error de "read-only"
    (process.env as any).NODE_ENV = 'test';
});

afterAll(() => {
    vi.clearAllMocks();
});