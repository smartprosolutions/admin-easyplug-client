import * as Yup from "yup";

/** SA mobile: 0821234567, +27821234567, or 27821234567. */
export const SA_CELLPHONE_RE = /^(?:\+27|27|0)[6-8][0-9]{8}$/;

/** Keep digits and a single leading +. */
export const sanitizePhoneInput = (value) => {
  const raw = String(value ?? "").replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) {
    return `+${raw.slice(1).replace(/\+/g, "")}`;
  }
  return raw.replace(/\+/g, "");
};

export const isValidSouthAfricanCellphone = (phone) => {
  if (!phone) return false;
  return SA_CELLPHONE_RE.test(sanitizePhoneInput(phone));
};

/**
 * @param {{ required?: boolean, label?: string }} [options]
 */
export const createPhoneFieldSchema = (options = {}) => {
  const { required = true, label = "Cellphone" } = options;

  let schema = Yup.string()
    .transform((value) =>
      typeof value === "string" ? sanitizePhoneInput(value) : value,
    )
    .matches(/^[+\d]*$/, `${label} can only contain numbers and +`);

  if (required) {
    schema = schema
      .required(`${label} number is required`)
      .matches(
        SA_CELLPHONE_RE,
        `Enter a valid South African cellphone (e.g. 0821234567 or +27821234567)`,
      );
  } else {
    schema = schema.matches(SA_CELLPHONE_RE, {
      message: `Enter a valid South African cellphone (e.g. 0821234567 or +27821234567)`,
      excludeEmptyString: true,
    });
  }

  return schema;
};
