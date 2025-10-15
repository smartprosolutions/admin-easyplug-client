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
  const { values, setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);

  const handleChange = (event) => {
    setFieldValue(name, event.target.value);
  };

  const configSelect = {
    ...field,
    ...otherProps,
    variant: "outlined",
    fullWidth: true,
    onChange: handleChange
  };

  return (
    <FormControl
      error={meta && meta.touched && meta.error ? true : null}
      fullWidth
      // size="small"
    >
      <InputLabel id="select">{label}</InputLabel>
      <Select
        {...configSelect}
        labelId="select"
        id="select_id"
        value={values[name]}
        label={label}
        // size="small"
      >
        {/* <MenuItem value="">
          <em>None</em>
        </MenuItem> */}
        {options.map((item, index) => {
          return (
            <MenuItem key={index} value={item.value}>
              {item.label}
            </MenuItem>
          );
        })}
      </Select>
      {meta.touched && meta.error ? (
        <FormHelperText>{meta.error}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export default SelectFieldWrapper;

SelectFieldWrapper.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired
};
