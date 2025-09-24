"use client";
import {
  ChevronRight,
  ChevronRightIcon,
  FileHeartIcon,
  Phone,
  Settings2,
} from "lucide-react";

import {
  InfoCard,
  InfoCardContent,
  InfoCardHeader,
  InfoCardTitle,
} from "./_component/info-card";

import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  BellIcon,
  CalendarIcon,
  CameraIcon,
  DownloadIcon,
  GlobeIcon,
  InfoIcon,
  MonitorIcon,
  SignOutIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";

export default function Page() {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="w-full flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="size-24 border ring-2 ring-ring/40 ring-offset-2 ring-offset-background">
                <AvatarImage src="./avatar-80-07.jpg" alt="select a photo" />
                <AvatarFallback>
                  <UserIcon className="text-ring" size={24} />
                </AvatarFallback>
              </Avatar>
              <button className="border-secondary-foreground bg-secondary flex items-center justify-center text-background absolute -end-3 -bottom-1 size-8 rounded-full border-2">
                <CameraIcon />
              </button>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          {/*Personal Information*/}
          <InfoCard>
            <InfoCardHeader>
              <InfoCardTitle>Personal Information</InfoCardTitle>
            </InfoCardHeader>
            <InfoCardContent>
              <div className="flex items-center p-4 justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      March 15, 1985
                    </p>
                  </div>
                </div>
              </div>
              <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <FileHeartIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Medical Profile</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </InfoCardContent>
          </InfoCard>
          {/*Emergency Contact*/}
          <InfoCard>
            <InfoCardHeader>
              <InfoCardTitle>Emergency Contact</InfoCardTitle>
            </InfoCardHeader>
            <InfoCardContent>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  John Johnson — +1 (555) 987-6543
                </p>
              </div>
            </InfoCardContent>
          </InfoCard>

          {/*Care Circle Access*/}
          <InfoCard>
            <InfoCardHeader className=" ">
              <div className="w-full flex items-center justify-between">
                <InfoCardTitle>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">Care Circle Access</h3>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="w-4 h-4 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          className="max-w-xs"
                        >
                          <p>
                            Add parents, nurses, or trusted contacts to view
                            adherence and receive alerts. You control what’s
                            shared.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </InfoCardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  effect="ringHover"
                  className="rounded-full"
                >
                  <Settings2 />
                </Button>
              </div>
            </InfoCardHeader>
            <InfoCardContent>
              <CareCircleList />
            </InfoCardContent>
          </InfoCard>

          {/* Security & Preferences */}
          <InfoCard>
            <InfoCardHeader>
              <InfoCardTitle>Security & Preferences</InfoCardTitle>
            </InfoCardHeader>
            <InfoCardContent>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <BellIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
                <Switch defaultChecked />
              </div>
              <button className="flex items-center justify-between cursor-pointer w-full p-4 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <GlobeIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Language (Eng)</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* New Logged-in Devices */}
              <button className="flex items-center justify-between cursor-pointer w-full p-4 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <MonitorIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Logged-in Devices</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <ThemeToggle />
            </InfoCardContent>
          </InfoCard>

          {/* Account management */}
          <InfoCard>
            <InfoCardHeader>
              <InfoCardTitle>Account management</InfoCardTitle>
            </InfoCardHeader>
            <InfoCardContent>
              <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <DownloadIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Export My Data</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                className="flex cursor-pointer items-center justify-between w-full p-4 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <SignOutIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </div>
              </button>
              <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors group">
                <div className="flex items-center space-x-3">
                  <TrashIcon className="w-5 h-5 text-destructive" />
                  <span className="text-sm font-medium text-destructive group-hover:text-destructive/80">
                    Delete Account
                  </span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </InfoCardContent>
          </InfoCard>
        </div>
      </div>
    </>
  );
}

function CareCircleList() {
  const caregivers = [
    {
      name: "Mary Doe",
      role: "Parent",
      avatar: "/placeholder-mom.png",
      fallback: "MD",
    },
    {
      name: "Alice Nurse",
      role: "Hospital Nurse",
      avatar: "/placeholder-nurse.png",
      fallback: "AN",
    },
  ];

  return (
    <div className="divide-y">
      {/* Caregivers */}
      {caregivers.map((caregiver, index) => (
        <div key={index}>
          <div className="flex items-center gap-3 p-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={caregiver.avatar} />
              <AvatarFallback>{caregiver.fallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{caregiver.name}</p>
              <p className="text-sm text-muted-foreground">{caregiver.role}</p>
            </div>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </div>
          {index < caregivers.length - 1 && <Separator />}
        </div>
      ))}

      {/* Invite */}
      <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
        <div className="flex items-center space-x-3">
          <UserPlusIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Invite Caregiver</span>
        </div>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
