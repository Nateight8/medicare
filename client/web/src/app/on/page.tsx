"use client";

import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "./_components/progress-indicator";
import { useEffect, useState } from "react";
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
import { useMutation } from "@apollo/client";
import { meOperation } from "@/graphql/operations/me";

//form
const formSchema = z.object({
  displayName: z.string(),
  image: z.string().optional(),
  age: z.number(),
  dateOfBirth: z.date().optional(),
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

  //month options
  const monthOptions: WheelPickerOption[] = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const createYearOptions = (): WheelPickerOption[] => {
    const currentYear = new Date().getFullYear();
    const startYear = 1920;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
      const year = currentYear - i; // Start from current year and go backwards
      return {
        label: year.toString(),
        value: year.toString(),
      };
    });
  };

  const yearOptions = createYearOptions();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: Number(options[0]?.value) || 1, // Use the first option's value as default
      displayName: "",
      image: "",
    },
  });

  const [updateUserProfile, { loading }] = useMutation(
    meOperation.Mutations.updateProfile
  );

  const onSubmit: SubmitHandler<FormSchema> = (values) => {
    console.log(values);
    updateUserProfile({
      variables: {
        input: {
          name: values.displayName, // Use displayName as the name for onboarding
          displayName: values.displayName,
          age: values.age,
          image: values.image,
        },
      },
    });
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
        {step === 3 && (
          <AgeWheelPicker
            form={form}
            options={options}
            monthOptions={monthOptions}
            yearOptions={yearOptions}
          />
        )}
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
            <Button
              loading={loading}
              loadingIconPlacement="left"
              loadingText="Submitting..."
              size="lg"
              effect="ringHover"
              type="submit"
            >
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
      name="displayName"
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
  monthOptions,
  yearOptions,
}: {
  options: WheelPickerOption[];
  form: FormType;
  monthOptions: WheelPickerOption[];
  yearOptions: WheelPickerOption[];
}) {
  const createDayOptions = (daysInMonth: number): WheelPickerOption[] =>
    Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        label: day.toString().padStart(2, "0"),
        value: day.toString(),
      };
    });

  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dayOptions, setDayOptions] = useState<WheelPickerOption[]>([]);

  // Initialize day options based on current month and year
  useEffect(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    setDayOptions(createDayOptions(daysInMonth));
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    setDayOptions(createDayOptions(daysInMonth));

    // Adjust selected day if it's beyond the days in the new month
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const updateFormAge = (day: number, month: number, year: number) => {
    // Create date at noon to avoid timezone issues
    const birthDate = new Date(year, month - 1, day, 12, 0, 0);

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // Update both age and date of birth in the form
    form.setValue("age", age);
    form.setValue("dateOfBirth", birthDate);
  };

  // Initialize with current date on component mount
  useEffect(() => {
    const today = new Date();
    setSelectedMonth(today.getMonth() + 1);
    setSelectedDay(today.getDate());
    setSelectedYear(today.getFullYear());

    // Set initial date of birth in the form
    form.setValue("dateOfBirth", today);

    // Calculate initial age
    updateFormAge(today.getDate(), today.getMonth() + 1, today.getFullYear());
  }, [form]);

  return (
    <FormField
      control={form.control}
      name="age"
      render={({ field }) => (
        <FormItem className="flex max-w-md  mx-auto flex-1 flex-col items-center justify-center">
          <FormLabel className="text-2xl mb-4 text-center font-semibold tracking-tight">
            Date of Birth
          </FormLabel>

          <FormControl>
            <div className="w-80 ">
              <WheelPickerWrapper>
                <WheelPicker
                  options={dayOptions}
                  value={selectedDay.toString()}
                  onValueChange={(val) => {
                    const day = Number(val);
                    setSelectedDay(day);
                    updateFormAge(day, selectedMonth, selectedYear);
                  }}
                />
                <WheelPicker
                  options={monthOptions}
                  value={selectedMonth.toString()}
                  onValueChange={(val) => {
                    const month = Number(val);
                    setSelectedMonth(month);
                    updateFormAge(selectedDay, month, selectedYear);
                  }}
                />
                <WheelPicker
                  options={yearOptions}
                  value={selectedYear.toString()}
                  onValueChange={(val) => {
                    const year = Number(val);
                    setSelectedYear(year);
                    updateFormAge(selectedDay, selectedMonth, year);
                  }}
                />
              </WheelPickerWrapper>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function Preview({ form }: { form: FormType }) {
  const displayName = form.watch("displayName");

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
