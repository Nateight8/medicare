import {
  DeviceMobileSpeakerIcon,
  XIcon,
  DeviceTabletCameraIcon,
} from "@phosphor-icons/react";
import { Button } from "./ui/button";
import {
  InfoCard,
  InfoCardContent,
  InfoCardHeader,
  InfoCardTitle,
} from "@/app/profile/_component/info-card";
import { LaptopIcon } from "lucide-react";
import { sessionOperation, userSession } from "@/graphql/operations/session";
import { getCompactRelativeTime } from "@/lib/relative-time";
import { useSessions } from "@/hooks/use-sessions";
import { useMutation } from "@apollo/client";

export default function UserSessions() {
  const { currentDevice, otherDevices } = useSessions();

  const [revokeSessions] = useMutation(
    sessionOperation.Mutations.revokeSessions
  );

  const revokeAllSessions = () => {
    revokeSessions({
      variables: {
        sessionIds: otherDevices?.map((device) => device.id),
      },
    });
  };

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
                    {currentDevice &&
                      renderDeviceIcon({
                        deviceType: currentDevice?.deviceType,
                      })}
                  </div>
                  <div>
                    <p className="">{currentDevice?.os}</p>
                    <p className="text-xs text-muted-foreground">
                      <span>{currentDevice?.city || "🌎"}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {currentDevice &&
                          getCompactRelativeTime(currentDevice?.lastActive)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-4">
              <h2 className="mb-4">Other Devices</h2>
              {otherDevices && otherDevices?.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No known devices found
                </p>
              ) : (
                otherDevices?.map((device) => (
                  <Device key={device.id} {...device} />
                ))
              )}
            </div>
            {otherDevices && otherDevices?.length > 0 && (
              <div className="py-4">
                <h1 className="text-base font-semibold mb-1">
                  log out of all known devices
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                  You will need to log in again on each device.
                </p>
                <Button
                  className="bg-destructive/5 text-destructive hover:bg-destructive/20"
                  variant="destructive"
                  size="sm"
                  onClick={revokeAllSessions}
                >
                  Log out all known devices
                </Button>
              </div>
            )}
          </InfoCardContent>
        </InfoCard>
      </div>
    </div>
  );
}

function Device({ lastActive, deviceType, city, os, id }: userSession) {
  const [revokeSessions] = useMutation(
    sessionOperation.Mutations.revokeSessions
  );

  const handleRevokeSession = () => {
    revokeSessions({
      variables: {
        sessionIds: [id],
      },
    });
  };

  return (
    <div className="flex py-2 items-center justify-between">
      <div className="space-x-4 flex items-center flex-1">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          {renderDeviceIcon({ deviceType })}
        </div>
        <div>
          <p className="">{os}</p>
          <p className="text-xs text-muted-foreground">
            <span>{city}</span>
            <span className="mx-2">•</span>
            <span>{lastActive && getCompactRelativeTime(lastActive)}</span>
          </p>
        </div>
      </div>
      <Button
        onClick={handleRevokeSession}
        className="rounded-full"
        size="icon"
        variant="ghost"
      >
        <XIcon />
      </Button>
    </div>
  );
}

function renderDeviceIcon({ deviceType }: { deviceType: string }) {
  switch (deviceType) {
    case "DESKTOP":
      return <LaptopIcon className="text-muted-foreground" />;
    case "TABLET":
      return <DeviceTabletCameraIcon className="text-muted-foreground" />;
    case "MOBILE":
      return <DeviceMobileSpeakerIcon className="text-muted-foreground" />;
    default:
      return null;
  }
}
