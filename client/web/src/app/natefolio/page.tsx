"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "@phosphor-icons/react";
import Section from "./_components/section";
import Socials from "./_components/socials";

export default function Page() {
  return (
    <div className="py-4">
      <Section>
        <div className="w-full h-14 max-w-3xl flex items-center justify-center">
          c
        </div>
      </Section>
      <Section>
        <div className=" w-full h-64 max-w-3xl flex items-center justify-center">
          c
        </div>
      </Section>
      <Section>
        <div className="w-full max-w-3xl flex ">
          <div className="border-r">
            <div className="p-0.5 border border-ring/10 rounded-full">
              <Avatar className="size-40">
                <AvatarImage />
                <AvatarFallback>
                  <UserIcon className="size-10" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="h-40 w-full flex flex-col justify-end  divide-y">
            <div className="border-t px-4 py-1">
              <h1 className="text-2xl font-medium">Chánh Đại</h1>
            </div>
            <div className=" px-4 py-1">
              <h1 className="text-muted-foreground">Design Engineer</h1>
            </div>
          </div>
        </div>
      </Section>
      <Section>
        <div className="h-10"></div>
      </Section>
      <Section>
        <div className="h-48"></div>
      </Section>
      <Section>
        <div className="h-6"></div>
      </Section>
      <Socials />
    </div>
  );
}
