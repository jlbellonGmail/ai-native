/**
 * Valida la robustez de una contraseña según los estándares del ecosistema.
 * @param {string} password - La contraseña a evaluar.
 * @returns {{is_valid: boolean, error_code?: string}}
 */
export function validate_password_strength(password: string) {
    if (password.length < 12) {
        return { is_valid: false, error_code: 'TOO_SHORT' };
    }

    const has_number = /\d/.test(password);
    if (!has_number) {
        return { is_valid: false, error_code: 'MISSING_NUMBER' };
    }

    return { is_valid: true };
}