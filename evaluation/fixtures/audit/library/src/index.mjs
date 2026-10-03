/**
 * Converts text to a URL slug: lower-case ASCII letters, digits and single separators.
 * @param {string} text
 * @param {{separator?: string, maxLength?: number}} [options]
 * @returns {string}
 * @throws {TypeError} when `text` is not a string.
 * @throws {RangeError} when `separator` is not a single [a-z0-9_-] character.
 */
export function slugify(text, { separator = "-", maxLength = 80 } = {}) {
  if (typeof text !== "string") throw new TypeError("slugify expects a string");
  if (!/^[a-z0-9_-]$/i.test(separator)) throw new RangeError("separator must be a single [a-z0-9_-] character");
  const escaped = separator.replace(/[-]/g, "\\-");
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^[${escaped}]+|[${escaped}]+$`, "g"), "");
  return slug.slice(0, maxLength).replace(new RegExp(`[${escaped}]+$`), "");
}
