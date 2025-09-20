import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Camera,
  ChevronRight,
  Shield,
  Bell,
  Globe,
  Phone,
  Calendar,
  User,
  FileHeart,
  UserPlus,
  Download,
  Trash2,
  Settings,
  Info,
  Monitor,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import InfoCard from "./_component/info-card";

// Reusable Care Circle List
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
          <UserPlus className="w-5 h-5" />
          <span className="text-sm font-medium">Invite Caregiver</span>
        </div>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="p-6 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <User className="w-12 h-12 text-background" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-lg hover:bg-secondary/80 hover:backdrop-blur-3xl cursor-pointer transition-colors">
              <Camera className="w-4 h-4 text-background" />
            </button>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">Sarah Johnson</h2>
            <p className="text-muted-foreground">sarah@email.com</p>
          </div>
        </div>

        {/* Personal Information */}
        <InfoCard />

        {/* Emergency Contact */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Emergency Contact</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              John Johnson — +1 (555) 987-6543
            </p>
          </div>
        </div>

        {/* Care Circle Access */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-muted/50">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">Care Circle Access</h3>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs">
                    <p>
                      Add parents, nurses, or trusted contacts to view adherence
                      and receive alerts. You control what’s shared.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
          <CareCircleList />
        </div>

        {/* Security & Preferences */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-muted/50">
          <div className="p-4 border-b flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <h3 className="font-medium">Security & Preferences</h3>
          </div>
          <div className="divide-y">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <Switch defaultChecked />
            </div>
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">Language</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* New Logged-in Devices */}
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5" />
                <span className="text-sm font-medium">Logged-in Devices</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Account Management */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Account Management</h3>
          </div>
          <div className="divide-y">
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Export My Data</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors group">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium text-destructive group-hover:text-destructive/80">
                  Delete Account
                </span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
