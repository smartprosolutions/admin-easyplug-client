import * as Yup from "yup";

/** RSA ID: 13 digits with basic DOB + Luhn checks (same as registration). */
export function isValidSouthAfricanId(id) {
  if (typeof id !== "string") return false;
  const value = id.replace(/\s+/g, "");
  if (!/^\d{13}$/.test(value)) return false;

  const yy = Number(value.slice(0, 2));
  const mm = Number(value.slice(2, 4));
  const dd = Number(value.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const centuryGuess = 2000 + yy <= currentYear ? 2000 : 1900;
  const fullYear = centuryGuess + yy;
  const dob = new Date(fullYear, mm - 1, dd);
  if (
    dob.getFullYear() !== fullYear ||
    dob.getMonth() !== mm - 1 ||
    dob.getDate() !== dd ||
    dob > now
  ) {
    const altYear = centuryGuess === 2000 ? 1900 + yy : 2000 + yy;
    const altDob = new Date(altYear, mm - 1, dd);
    if (
      altDob.getFullYear() !== altYear ||
      altDob.getMonth() !== mm - 1 ||
      altDob.getDate() !== dd ||
      altDob > now
    ) {
      return false;
    }
  }

  if (!["0", "1", "2"].includes(value[10])) return false;

  let sum = 0;
  let alt = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let n = Number(value[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export const createSouthAfricanIdSchema = (label = "RSA ID") =>
  Yup.string()
    .required("Required")
    .transform((v) => (typeof v === "string" ? v.replace(/\s+/g, "") : v))
    .matches(/^\d{13}$/, `${label} must be exactly 13 digits`)
    .test(
      "rsa-id",
      `Enter a valid South African ID number`,
      (v) => !v || isValidSouthAfricanId(v),
    );
