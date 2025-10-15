import { TextField } from "@mui/material";
import { useField } from "formik";
import React from "react";

const TextFieldWrapper = ({ name, label, ...otherProps }) => {
  const [field, meta] = useField(name);

  const configTextField = {
    ...field,
    ...otherProps,
    fullWidth: true,
    variant: "outlined",
  };

  if (meta?.touched && meta?.error) {
    configTextField.error = true;
    configTextField.helperText = meta.error;
  }

  return <TextField {...configTextField} label={label} />;
};

export default TextFieldWrapper;
