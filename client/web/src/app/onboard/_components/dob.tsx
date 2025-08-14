"use client";

import { Label } from "react-aria-components";
import { Controller, useFormContext } from "react-hook-form";
import { DateField, DateInput } from "@/components/ui/datefield-rac";
import { parseDate } from "@internationalized/date";

export default function DateOfBirth() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      name="dob"
      control={control}
      render={({ field: { onChange, value } }) => (
        <DateField
          className="*:not-first:mt-2"
          value={
            value
              ? parseDate(new Date(value).toISOString().split("T")[0])
              : null
          }
          onChange={(date) => {
            const formattedDate = date
              ? new Date(date.year, date.month - 1, date.day)
                  .toISOString()
                  .split("T")[0]
              : "";
            onChange(formattedDate);
          }}
        >
          <Label className="text-foreground text-sm font-medium">
            Date of Birth
          </Label>
          <DateInput className="w-full" />
          {errors.dob && (
            <p className="text-sm font-medium text-destructive mt-1">
              {errors.dob.message as string}
            </p>
          )}
        </DateField>
      )}
    />
  );
}
