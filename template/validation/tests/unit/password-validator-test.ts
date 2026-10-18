import { describe, it, expect } from 'vitest';
// @ts-ignore - El archivo no existe aún (Fase Roja)
import { validate_password_strength } from '@/domain/services/password-validator';

describe('MANDATO: Seguridad de Credenciales', () => {
    it('debe rechazar contraseñas de menos de 12 caracteres', () => {
        const result = validate_password_strength('Short1!');
        expect(result.is_valid).toBe(false);
        expect(result.error_code).toBe('TOO_SHORT');
    });

    it('debe rechazar contraseñas sin números', () => {
        const result = validate_password_strength('NoNumbersAllowed!');
        expect(result.is_valid).toBe(false);
        expect(result.error_code).toBe('MISSING_NUMBER');
    });

    it('debe aceptar contraseñas válidas de nivel 12/10', () => {
        const result = validate_password_strength('Contrasena_Segura_2026!');
        expect(result.is_valid).toBe(true);
    });
});