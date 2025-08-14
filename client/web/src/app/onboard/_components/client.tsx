// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import { Form } from "@/components/ui/form";

// import DisplayPhoto from "./_components/display-photo";
// import { useState } from "react";
// import { SubmitHandler } from "react-hook-form";
// import DisplayName from "./_components/display-name";
// import DateOfBirth from "./_components/dob";

// // Define the form schema with proper types
// type FormInput = {
//   name: string;
//   dob: string;
//   //   phoneNumber: string;
// };

// type FormValues = {
//   name: string;
//   dob: Date;
//   //   phoneNumber: string;
// };

// const formSchema = z.object({
//   name: z.string().min(2, {
//     message: "Name must be at least 2 characters.",
//   }),
//   dob: z
//     .string()
//     .refine(
//       (val) => {
//         const date = new Date(val);
//         return !isNaN(date.getTime());
//       },
//       { message: "A valid date of birth is required." }
//     )
//     .refine((val) => new Date(val) >= new Date("1900-01-01"), {
//       message: "Date of birth must be after 1900",
//     })
//     .refine((val) => new Date(val) <= new Date(), {
//       message: "Date of birth cannot be in the future",
//     }),
//   //   phoneNumber: z.string().min(10, {
//   //     message: "Please enter a valid phone number.",
//   //   }),
// });

// export default function OnboardPage() {
//   const form = useForm<FormInput>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       name: "",
//       dob: "",
//     },
//   });

//   const [step, setStep] = useState(1);
//   const totalSteps = 3;

//   const onSubmit: SubmitHandler<FormInput> = (data) => {
//     console.log("Form submission started");
//     console.log("Raw form data:", data);

//     // Parse and validate the form data
//     const values: FormValues = {
//       name: data.name,
//       dob: new Date(data.dob),
//     };

//     console.log("Processed form values:", values);

//     // Add an error boundary
//     try {
//       console.log("Form submitted successfully", values);
//       // Handle successful submission here
//     } catch (error) {
//       console.error("Error in form submission:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="w-full max-w-md space-y-8">
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold">
//             Welcome! Let&apos;s Get Started
//           </h1>
//           <p className="text-muted-foreground mt-2 mb-4">
//             Just a few details to personalize your medication tracking
//             experience
//           </p>

//           {/* Step Indicator */}
//           <div className="flex justify-center gap-2 mt-6">
//             {[1, 2].map((stepNumber) => (
//               <div
//                 key={stepNumber}
//                 className={`h-2 w-2 rounded-full transition-all ${
//                   step === stepNumber
//                     ? "bg-primary w-6"
//                     : step > stepNumber
//                     ? "bg-primary/50 w-4"
//                     : "bg-muted w-2"
//                 }`}
//               />
//             ))}
//           </div>
//         </div>

//         <Form {...form}>
//           <form
//             onSubmit={(e) => {
//               console.log("Form submit event triggered");
//               // Log form state before submission
//               console.log("Form errors:", form.formState.errors);
//               console.log("Is form valid:", form.formState.isValid);
//               form.handleSubmit(onSubmit)(e).catch(console.error);
//             }}
//             className="space-y-6 w-full flex flex-col items-center"
//           >
//             <div className="w-full aspect-video flex items-center justify-center">
//               {/* {step === 1 && <DisplayPhoto />} */}
//               <DisplayName />
//               {/* {step === 1 && <DisplayName />} */}
//               {/* {step === 2 && <DateOfBirth />} */}
//             </div>
//             <div className="w-full flex justify-between mt-8">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setStep((prev) => Math.max(1, prev - 1))}
//                 disabled={step === 1}
//               >
//                 Back
//               </Button>

//               {step === 1 ? (
//                 <Button type="submit">Complete Setup</Button>
//               ) : (
//                 <Button
//                   type="button"
//                   onClick={() => setStep((prev) => Math.min(1, prev + 1))}
//                 >
//                   Next
//                 </Button>
//               )}
//             </div>
//           </form>
//         </Form>
//       </div>
//     </div>
//   );
// }
