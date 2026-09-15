import React from "react";
import { useField, useFormikContext } from "formik";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from "@mui/material";
import PropTypes from "prop-types";

const SelectFieldWrapper = ({ name, label, options, ...otherProps }) => {
  const { values, setFieldValue, setFieldTouched, submitCount } =
    useFormikContext();
  const [field, meta] = useField(name);
  const showError = Boolean(meta?.error && (meta.touched || submitCount > 0));
  const labelId = `${name}-select-label`;

  const handleChange = (event) => {
    setFieldValue(name, event.target.value, true);
    setFieldTouched(name, true, false);
  };

  const configSelect = {
    ...field,
    ...otherProps,
    variant: "outlined",
    fullWidth: true,
    onChange: handleChange
  };

  return (
    <FormControl error={showError} fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        {...configSelect}
        labelId={labelId}
        id={`${name}-select`}
        value={values[name] ?? ""}
        label={label}
      >
        {options.map((item, index) => {
          return (
            <MenuItem key={index} value={item.value}>
              {item.label}
            </MenuItem>
          );
        })}
      </Select>
      {showError ? <FormHelperText>{meta.error}</FormHelperText> : null}
    </FormControl>
  );
};

export default SelectFieldWrapper;

SelectFieldWrapper.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired
};
