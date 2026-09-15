import * as Yup from "yup";

const COMMON_PASSWORDS = new Set(
  [
    "password",
    "password1",
    "password12",
    "password123",
    "password1234",
    "passw0rd",
    "qwerty",
    "qwerty1",
    "qwerty12",
    "qwerty123",
    "qwertyuiop",
    "12345678",
    "123456789",
    "1234567890",
    "11111111",
    "00000000",
    "abcdefgh",
    "abcdefg1",
    "abc12345",
    "letmein",
    "letmein1",
    "welcome",
    "welcome1",
    "admin123",
    "admin1234",
    "iloveyou",
    "monkey12",
    "dragon12",
    "baseball",
    "football",
    "sunshine",
    "princess",
    "login123",
    "changeme",
    "trustno1",
  ].map((p) => p.toLowerCase()),
);

const OBVIOUS_SEQUENCES = [
  "012345",
  "123456",
  "234567",
  "345678",
  "456789",
  "567890",
  "abcdef",
  "bcdefg",
  "cdefgh",
  "defghi",
  "efghij",
  "fghijk",
  "ghijkl",
  "hijklm",
  "ijklmn",
  "jklmno",
  "klmnop",
  "lmnopq",
  "mnopqr",
  "nopqrs",
  "opqrst",
  "pqrstu",
  "qrstuv",
  "rstuvw",
  "stuvwx",
  "tuvwxy",
  "uvwxyz",
  "qwerty",
  "asdfgh",
  "zxcvbn",
  "qwertz",
  "azerty",
];

/**
 * Builds a Yup password schema matching Easyplug password policy.
 * @param {{
 *   emailField?: string,
 *   usernameField?: string,
 *   compareEmail?: string,
 * }} [options]
 */
export function createPasswordSchema({
  emailField = "email",
  usernameField,
  compareEmail,
} = {}) {
  return Yup.string()
    .required("Required")
    .min(8, "Minimum 8 characters (12+ recommended for better security)")
    .max(64, "Maximum 64 characters")
    .matches(/[A-Z]/, "At least one uppercase letter (A–Z)")
    .matches(/[a-z]/, "At least one lowercase letter (a–z)")
    .matches(/[0-9]/, "At least one number (0–9)")
    .matches(
      /[!@#$%^&*()_+\-=]/,
      "At least one special character (e.g. ! @ # $ % ^ & * ( ) _ + - =)",
    )
    .test(
      "no-spaces",
      "Must not contain spaces",
      (value) => !value || !/\s/.test(value),
    )
    .test(
      "not-email-or-username",
      "Must not be the same as the username or email address",
      function (value) {
        if (!value) return true;
        const lower = value.toLowerCase();
        const email = String(
          compareEmail ?? this.parent?.[emailField] ?? "",
        )
          .trim()
          .toLowerCase();
        const username = usernameField
          ? String(this.parent?.[usernameField] ?? "").trim().toLowerCase()
          : email.includes("@")
            ? email.split("@")[0]
            : "";

        if (email && lower === email) return false;
        if (username && lower === username) return false;
        return true;
      },
    )
    .test(
      "not-common",
      "Must not be a commonly used password (e.g. password123, qwerty, 12345678)",
      (value) => !value || !COMMON_PASSWORDS.has(value.toLowerCase()),
    )
    .test(
      "no-sequences",
      "Must not contain obvious sequences (e.g. 123456, abcdef, qwerty)",
      (value) => {
        if (!value) return true;
        const lower = value.toLowerCase();
        return !OBVIOUS_SEQUENCES.some((seq) => lower.includes(seq));
      },
    )
    .test(
      "no-repeated",
      "Must not contain repeated characters (e.g. aaaa1111)",
      (value) => !value || !/(.)\1{3,}/.test(value),
    );
}
