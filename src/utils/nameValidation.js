import * as Yup from "yup";

/** Letters (incl. accents), optional internal spaces, hyphens, and apostrophes. No digits. */
export const NAME_PATTERN = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;

/** Strip digits and other disallowed characters while typing. */
export const sanitizeNameInput = (value) =>
  String(value ?? "")
    .replace(/[^\p{L} '\-]/gu, "")
    .replace(/\s{2,}/g, " ");

/**
 * Shared firstName / lastName Yup schema (matches registration + API rules).
 * @param {string} label e.g. "First name"
 */
export const createNameFieldSchema = (label = "Name") =>
  Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required(`${label} is required`)
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)
    .test(
      "no-numbers",
      `${label} cannot contain numbers`,
      (value) => !value || !/\d/.test(value),
    )
    .matches(
      NAME_PATTERN,
      `${label} can only contain letters, spaces, hyphens, and apostrophes`,
    );
