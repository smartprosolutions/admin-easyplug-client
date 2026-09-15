import { TextField } from "@mui/material";
import { useField, useFormikContext } from "formik";
import React from "react";

const CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

const TextFieldWrapper = ({
  name,
  label,
  sanitize,
  blockDigits = false,
  allowOnlyPattern,
  onChange: onChangeProp,
  onKeyDown: onKeyDownProp,
  ...otherProps
}) => {
  const [field, meta, helpers] = useField(name);
  const { submitCount } = useFormikContext();
  const showError = Boolean(meta?.error && (meta.touched || submitCount > 0));

  const handleChange = (e) => {
    const nextValue = sanitize ? sanitize(e.target.value) : e.target.value;

    if (sanitize) {
      helpers.setValue(nextValue, true);
    } else {
      field.onChange(e);
    }

    onChangeProp?.({
      ...e,
      target: { ...e.target, value: nextValue, name },
    });
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || CONTROL_KEYS.has(e.key)) {
      onKeyDownProp?.(e);
      return;
    }

    if (blockDigits && /\d/.test(e.key)) {
      e.preventDefault();
    }

    if (
      allowOnlyPattern &&
      e.key.length === 1 &&
      !allowOnlyPattern.test(e.key)
    ) {
      e.preventDefault();
    }

    onKeyDownProp?.(e);
  };

  const configTextField = {
    ...field,
    ...otherProps,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    fullWidth: true,
    variant: "outlined",
  };

  if (showError) {
    configTextField.error = true;
    configTextField.helperText = meta.error;
  }

  return <TextField {...configTextField} label={label} />;
};

export default TextFieldWrapper;
