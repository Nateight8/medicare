"use client";

import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "./_components/progress-indicator";
import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import {
  CameraIcon,
  QuestionIcon,
  StarIcon,
  UserIcon,
} from "@phosphor-icons/react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  WheelPicker,
  WheelPickerOption,
  WheelPickerWrapper,
} from "@/components/wheel-picker";

//form
const formSchema = z.object({
  name: z.string(),
  image: z.string().optional(),
  age: z.number(),
});

type FormSchema = z.infer<typeof formSchema>;

type FormType = UseFormReturn<FormSchema>;

const createArray = (length: number, add = 1): WheelPickerOption[] =>
  Array.from({ length }, (_, i) => {
    const value = i + add;
    return {
      label: value.toString().padStart(2, "0"),
      value: value.toString(),
    };
  });

export default function Page() {
  const options = createArray(60);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: Number(options[0]?.value) || 1, // Use the first option's value as default
    },
  });

  const onSubmit: SubmitHandler<FormSchema> = (values) => {
    console.log(values);
  };

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-screen w-full flex-col p-6 md:p-20"
      >
        {/* header */}

        <div className="flex items-center justify-between md:px-14 gap-2 w-full max-w-md mx-auto md:h-20 ">
          <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
          <div className="">
            <Tooltip>
              <TooltipTrigger>
                <QuestionIcon />
              </TooltipTrigger>
              <TooltipContent className="w-3xs">
                {step === 1 &&
                  "Optional photo to make the app feel more personal"}
                {step === 2 &&
                  "This name appears throughout your personal health profile"}
                {step === 3 &&
                  "Used to personalize health insights and recommendations"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* content */}
        {step === 1 && <AvatarUpload />}
        {step === 2 && <DisplayName form={form} />}
        {step === 3 && <AgeWheelPicker form={form} options={options} />}
        {step >= 4 && <Preview form={form} />}

        {/* footer */}
        <div className="flex flex-col gap-2 w-full max-w-md mx-auto md:h-64 md:px-14 ">
          {step <= 3 && (
            <Button
              disabled={step === 4}
              onClick={nextStep}
              size="lg"
              effect="ringHover"
              type="button"
            >
              {step === 1 ? "Skip" : "Next"}
            </Button>
          )}

          {step === 4 && (
            <Button size="lg" effect="ringHover" type="submit">
              Submit
            </Button>
          )}
          <Button
            disabled={step === 1}
            onClick={prevStep}
            variant="ghost"
            size="lg"
            effect="ringHover"
            type="button"
          >
            <ArrowLeftIcon />
            Previous
          </Button>
        </div>
      </form>
    </Form>
  );
}

function AvatarUpload() {
  return (
    <div className="flex-1 flex-col md:border-b py-4 md:px-14 flex items-center max-w-md mx-auto w-full justify-center">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Add a pic</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-prose">
          Just to personalize your health profile. Totally optional
        </p>
      </div>
      <div className="relative">
        <Avatar className="size-48 border ring-2 ring-ring/40 ring-offset-2 ring-offset-background">
          <AvatarImage src="./avatar-80-07.jpg" alt="select a photo" />
          <AvatarFallback>
            <UserIcon className="text-ring" size={24} />
          </AvatarFallback>
        </Avatar>
        <button className="border-secondary-foreground bg-secondary flex items-center justify-center text-background absolute end-4 bottom-0 size-8 rounded-full border-2">
          <CameraIcon />
        </button>
      </div>
    </div>
  );
}

function DisplayName({ form }: { form: FormType }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <div className="flex-1 py-4 border-b md:px-14 flex items-center md:items-end max-w-md mx-auto w-full justify-center">
          <FormItem className="w-full">
            <FormLabel>Display Name</FormLabel>

            <FormControl>
              <Input
                {...field}
                placeholder="Enter your name"
                className="h-11"
              />
            </FormControl>
            {/* conditionally render between form description and form message in the form ui component */}
            {/* {f ? (
              <FormMessage />
            ) : (
              <FormDescription> Your preferred name</FormDescription>
            )} */}
          </FormItem>
        </div>
      )}
    />
  );
}

function AgeWheelPicker({
  form,
  options,
}: {
  options: WheelPickerOption[];
  form: FormType;
}) {
  return (
    <FormField
      control={form.control}
      name="age"
      render={({ field }) => (
        <FormItem className="flex max-w-md mx-auto flex-1 flex-col items-center justify-center">
          <FormLabel className="text-2xl text-center font-semibold tracking-tight">
            How old are you?
          </FormLabel>

          <FormControl>
            <WheelPickerWrapper>
              <WheelPicker
                options={options}
                value={field.value?.toString() || options[0]?.value}
                onValueChange={(val) => field.onChange(Number(val))}
              />
            </WheelPickerWrapper>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function Preview({ form }: { form: FormType }) {
  const displayName = form.watch("name");

  return (
    <>
      <div className="flex-1 max-w-md mx-auto w-full flex items-center md:px-14 justify-center">
        <div className=" w-full flex justify-between flex-col-reverse gap-4 items-center px-4 pt-8 pb-14 rounded-md">
          <div className="">
            <p className="text-xl font-semibold">{displayName}</p>
            <div className="border hidden w-fit rounded-full">
              <StarIcon />
            </div>
          </div>
          <Avatar className="size-20">
            <AvatarImage src="./avatar-80-07.jpg" alt="select a photo" />
            <AvatarFallback>
              <UserIcon className="text-ring" size={24} />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </>
  );
}
