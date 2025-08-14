"use client";

import { useId } from "react";
import { ImagePlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type ProfileFormData = {
  displayName: string;
  phoneNumber: string;
  address: string;
};

export default function Component() {
  const form = useForm<ProfileFormData>({
    defaultValues: {
      displayName: "",
      phoneNumber: "",
      address: "",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    console.log("Form submitted:", data);
    // Handle form submission here
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base text-center">
            Edit profile
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Make changes to your profile here. You can change your photo and set a
          username.
        </DialogDescription>
        <div className="overflow-y-auto">
          <Avatar />
          <div className="px-6 pt-4 pb-6">
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-muted-foreground">
                          Display name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Margaret Villard"
                            type="text"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="mt-1 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-muted-foreground">
                          Phone number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 123-4567"
                            type="tel"
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="mt-1 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-muted-foreground">
                          Address
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="123 Main St, City, State 12345"
                            rows={3}
                            className="mt-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="mt-1 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={form.handleSubmit(onSubmit)}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Avatar() {
  const [{ files }, { openFileDialog, getInputProps }] = useFileUpload({
    accept: "image/*",
    initialFiles: [],
  });

  const currentImage = files[0]?.preview || null;

  return (
    <div className="flex justify-center pt-6 px-6">
      <div className="border-background bg-muted relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 shadow-xs shadow-black/10">
        <button
          type="button"
          className="focus-visible:border-ring focus-visible:ring-ring/50 absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
          onClick={openFileDialog}
          aria-label="Change profile picture"
        >
          <ImagePlusIcon size={16} aria-hidden="true" />
        </button>
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload profile picture"
        />
      </div>
    </div>
  );
}
