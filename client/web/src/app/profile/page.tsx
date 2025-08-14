"use client";

import {
  ArrowLeftIcon,
  GearIcon,
  UserIcon,
  CameraIcon,
  EnvelopeSimpleIcon,
  PencilSimpleLineIcon,
  PhoneIcon,
  MapPinIcon,
  CakeIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SettingsCard from "./_components/settings-card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-muted rounded-md transition-colors">
              <ArrowLeftIcon size={24} />
            </button>
            <h1 className="text-xl font-semibold">Profile</h1>
            <button className="p-2 hover:bg-muted rounded-md transition-colors">
              <GearIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className=" rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden">
                <Avatar className="w-32 h-32">
                  <AvatarFallback>
                    <UserIcon
                      size={32}
                      className="opacity-60"
                      aria-hidden="true"
                    />
                  </AvatarFallback>
                </Avatar>
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                <CameraIcon className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Dr. Sarah Johnson</h2>
              <p className="text-muted-foreground text-sm">
                sarah.johnson@email.com
              </p>
            </div>

            {/* Edit Profile Button */}
            <Button variant="outline" size="icon" className="rounded-full">
              <PencilSimpleLineIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-card rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Contact Information</h3>
          </div>
          <div className="divide-y">
            <SettingsCard
              title="Email"
              description="sarah.johnson@email.com"
              icon={<EnvelopeSimpleIcon className="w-5 h-5" />}
            />

            <SettingsCard
              title="Phone"
              description="+1 (555) 123-4567"
              icon={<PhoneIcon className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-card rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Personal Information</h3>
          </div>
          <div className="divide-y">
            <SettingsCard
              title="Date of Birth"
              description="March 15, 1985"
              icon={<CakeIcon className="w-5 h-5" />}
            />

            <SettingsCard
              title="Location"
              description="San Francisco, CA"
              icon={<MapPinIcon className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">
                  Active Medications
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground">Adherence Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-card rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Emergency Contact</h3>
          </div>
          <div className="">
            <SettingsCard
              title="Emergency Contact"
              description="John Johnson"
              variant="destructive"
              icon={<PhoneIcon className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
