"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import DisplayName from "./_components/display-name";

// Define the form schema
type FormValues = {
  name: string;
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  })
});

export default function OnboardPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // Handle form submission here
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            Welcome! Let&apos;s Get Started
          </h1>
          <p className="text-muted-foreground mt-2 mb-4">
            Just a few details to personalize your experience
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <div className="w-full">
              <DisplayName />
            </div>
            <Button type="submit" className="w-full">
              Complete Setup
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
