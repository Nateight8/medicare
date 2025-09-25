import { DeviceMobileSpeakerIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import {
  InfoCard,
  InfoCardContent,
  InfoCardHeader,
  InfoCardTitle,
} from "@/app/profile/_component/info-card";
import { LaptopIcon } from "lucide-react";

export default function UserSessions() {
  return (
    <div className="w-full min-h-screen border flex justify-center relative">
      <Button
        size="icon"
        variant="outline"
        className="rounded-full size-11 absolute top-4 left-4"
      >
        <XIcon />
      </Button>
      <div className=" w-full max-w-2xl mx-auto space-y-6 py-4 md:py-20">
        {/* Devices */}
        <InfoCard>
          <InfoCardHeader>
            <InfoCardTitle>Devices</InfoCardTitle>
          </InfoCardHeader>
          <InfoCardContent className="bg-transparent divide-y-0">
            <>
              <p className="text-sm text-muted-foreground">
                Here are the devices that have logged in to your account. You
                can remove any device that you no longer use. If you see a
                device that you don&apos;t recognize, please log out of that
                device and enable two-factor authentication to keep your account
                secure.
              </p>
            </>
            <div className="py-4">
              <h2 className="mb-4">Current Device</h2>
              <div className="flex py-2 items-center justify-between">
                <div className="space-x-4 flex items-center flex-1">
                  <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                    <LaptopIcon className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="">MacBook Pro</p>
                    <p className="text-xs text-muted-foreground">
                      Enugu, Nigeria
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-4">
              <h2 className="mb-4">Other Devices</h2>
              {DeviceList.map((device) => (
                <Device
                  deviceType={device.deviceType}
                  key={device.device}
                  device={device.device}
                  location={device.location}
                  lastActive={device.lastActive}
                />
              ))}
            </div>
          </InfoCardContent>
        </InfoCard>
      </div>
    </div>
  );
}

function Device({
  device,
  location,
  lastActive,
  deviceType,
}: {
  device: string;
  location: string;
  lastActive: string;
  deviceType: "Desktop" | "Mobile";
}) {
  return (
    <div className="flex py-2 items-center justify-between">
      <div className="space-x-4 flex items-center flex-1">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          {deviceType === "Desktop" ? (
            <LaptopIcon className="text-muted-foreground" />
          ) : (
            <DeviceMobileSpeakerIcon className="text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="">{device}</p>
          <p className="text-xs text-muted-foreground">
            <span>{location}</span>
            <span className="mx-2">•</span>
            <span>{lastActive}</span>
          </p>
        </div>
      </div>
      <Button className="rounded-full" size="icon" variant="ghost">
        <XIcon />
      </Button>
    </div>
  );
}

const DeviceList = [
  {
    device: "MacBook Pro",
    location: "Enugu, Nigeria",
    lastActive: "2 hours ago",
    deviceType: "Desktop" as const,
  },
  {
    device: "iPhone 12",
    location: "Enugu, Nigeria",
    lastActive: "2 hours ago",
    deviceType: "Mobile" as const,
  },
  {
    device: "MacBook Pro",
    location: "Enugu, Nigeria",
    lastActive: "2 hours ago",
    deviceType: "Desktop" as const,
  },
];
