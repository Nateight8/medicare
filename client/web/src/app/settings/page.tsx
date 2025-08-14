import { Switch } from "@/components/ui/switch";
import {
  Camera,
  Edit3,
  ChevronRight,
  Shield,
  Bell,
  Globe,
  Palette,
  Phone,
  Calendar,
  Lock,
  Download,
  Trash2,
} from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className=" border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="rounded-xl shadow-sm p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"></div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">Dr. Sarah Johnson</h2>
              <p className="text-muted-foreground">sarah.johnson@email.com</p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="rounded-xl shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Account Information</h3>
          </div>
          <div className="divide-y">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm">+1 (555) 123-4567</p>
                </div>
              </div>
              <button className="p-1 rounded-md transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm">March 15, 1985</p>
                </div>
              </div>
              <button className="p-1 rounded-md transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="rounded-xl shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Security & Privacy</h3>
          </div>
          <div className="divide-y">
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5" />
                <span className="text-sm font-medium">Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Two-Factor Authentication
                </span>
              </div>
              <Switch />
            </button>
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Privacy Settings</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* App Preferences */}
        <div className="rounded-xl shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">App Preferences</h3>
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
                <div className="text-left">
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs">English (US)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Palette className="w-5 h-5" />
                <span className="text-sm font-medium">Theme</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">Light</span>
                <Switch />
                <span className="text-xs">Dark</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Emergency Contact</h3>
          </div>
          <div className="divide-y">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">John Johnson</p>
                  <p className="text-sm">+1 (555) 987-6543</p>
                </div>
              </div>
              <button className="p-1 hover:bg-muted rounded-md transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Relationship
                  </p>
                  <p className="text-sm">Spouse</p>
                </div>
              </div>
              <button className="p-1 hover:bg-muted rounded-md transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="rounded-xl shadow-sm bg-muted/50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Account Management</h3>
          </div>
          <div className="divide-y">
            <button className="flex items-center justify-between w-full p-4 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Data Export</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-between w-full p-4 hover:bg-red-50 transition-colors group">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium text-red-600 group-hover:text-red-700">
                  Delete Account
                </span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
}
