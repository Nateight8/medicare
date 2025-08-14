"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function DisplayName() {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem className="">
          <FormLabel>Display Name</FormLabel>
          <FormControl>
            <Input
              placeholder="Enter your display name"
              {...field}
              autoComplete="name"
              className="text-base h-10"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
