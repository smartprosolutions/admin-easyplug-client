import { FormControl, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useField, useFormikContext } from "formik";
import React from "react";

const YearDatePicker = ({ name, label, ...otherProps }) => {
  const [field, meta] = useField(name);

  const { setFieldValue } = useFormikContext();

  const configField = {
    ...field,
    ...otherProps,
    fullWidth: true,
    variant: "outlined"
  };

  const configError = {};

  if (meta && meta.touched && meta.error) {
    configError.error = true;
    configError.helperText = meta.error;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormControl fullWidth>
        <DatePicker
          views={["year"]}
          label={label}
          {...configField}
          onChange={(date) => {
            setFieldValue(name, new Date(date).getFullYear().toString());
          }}
          renderInput={(params) => <TextField {...params} {...configError} />}
        />
      </FormControl>
    </LocalizationProvider>
  );
};

export default YearDatePicker;
