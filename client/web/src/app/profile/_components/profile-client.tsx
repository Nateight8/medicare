"use client";

import type React from "react";
import { useState } from "react";
import {
  ArrowLeftIcon,
  UserIcon,
  CameraIcon,
  PencilSimpleLineIcon,
  PhoneIcon,
  HeartIcon,
  DropIcon,
  ClockIcon,
  MoonIcon,
  ThermometerIcon,
  ScalesIcon,
  TrendUpIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-mobile";
import { HealthMetricData, HealthMetricEdit } from "./healt-metric-edit";

// Mock user data - replace with real data from useAuth
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  age: 32,
  gender: "Female",
  bloodGroup: "O+",
  bloodPressure: {
    systolic: 120,
    diastolic: 80,
    lastChecked: "March 10, 2024",
    status: "normal" as "normal" | "elevated" | "high",
  },
  bloodSugar: {
    value: 95,
    unit: "mg/dL",
    lastChecked: "March 12, 2024",
    status: "normal" as "normal" | "elevated" | "high",
  },
  weight: { value: 68, unit: "kg", lastRecorded: "March 15, 2024" },
  height: { value: 165, unit: "cm" },
  cholesterol: { lastChecked: "January 2024" },
  heartRate: {
    value: 72,
    unit: "bpm",
    status: "normal" as "normal" | "elevated" | "high",
  },
  temperature: { status: "Normal", lastRecorded: "Today" },
  sleepHours: {
    average: 7.2,
    status: "good" as "good" | "fair" | "poor",
  },
  activeMedications: 12,
  adherenceRate: 98,
  lastMedTaken: "2 hours ago",
  emergencyContact: { name: "John Johnson", phone: "+1 (555) 123-4567" },
};

function EmergencyContactCard({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  return (
    <div className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-6 hover:bg-muted/30 transition-colors rounded-lg">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
        <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Emergency Contact
          </p>
          <ShieldCheckIcon className="w-3 h-3 text-red-500" />
        </div>
        <p className="font-semibold text-foreground truncate sm:text-base">
          {name}
        </p>
        <p className="text-sm text-muted-foreground font-mono break-all sm:break-normal">
          {phone}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
      >
        <PencilSimpleLineIcon className="w-3 h-3 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
}

function getStatusBorder(status: string) {
  switch (status?.toLowerCase()) {
    case "normal":
    case "good":
      return "border-green-200/50";
    case "elevated":
    case "fair":
      return "border-yellow-200/50";
    case "high":
    case "poor":
      return "border-red-200/50";
    default:
      return "border-border/50";
  }
}

function HealthMetricCard({
  title,
  value,
  unit,
  icon,
  lastChecked,
  status,
  trend,
  metricData,
  onEdit,
}: {
  title: string;
  value?: number | string;
  unit?: string;
  icon: React.ReactNode;
  lastChecked?: string;
  status?: string;
  trend?: "up" | "down" | "stable";
  metricData?: HealthMetricData;
  onEdit?: (updatedMetric: HealthMetricData) => void;
}) {
  return (
    <div
      className={`bg-gradient-to-br from-card to-muted/20 rounded-xl p-4 sm:p-5 border hover:shadow-md transition-all duration-200 hover:border-border ${
        status ? getStatusBorder(status) : "border-border/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/10 flex-shrink-0">
            {icon}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {trend && trend !== "stable" && (
            <TrendUpIcon
              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                trend === "up" ? "text-green-600" : "text-red-600 rotate-180"
              }`}
            />
          )}
          {metricData && onEdit ? (
            <HealthMetricEdit metric={metricData} onSave={onEdit} />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full"
            >
              <PencilSimpleLineIcon className="w-2 h-2 sm:w-3 sm:h-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {value}
            {unit && (
              <span className="text-xs sm:text-sm font-medium text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </p>
        </div>
        {lastChecked && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ClockIcon className="w-2 h-2 sm:w-3 sm:h-3" />
            Last: {lastChecked}
          </p>
        )}
      </div>
    </div>
  );
}

function EditProfileForm({
  user,
  onSave,
  onCancel,
}: {
  user: typeof mockUser;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    age: user.age.toString(),
    gender: user.gender,
    bloodGroup: user.bloodGroup,
    emergencyContactName: user.emergencyContact.name,
    emergencyContactPhone: user.emergencyContact.phone,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      name: formData.name,
      email: formData.email,
      age: Number.parseInt(formData.age),
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="Age"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) =>
              setFormData({ ...formData, gender: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group</Label>
          <Select
            value={formData.bloodGroup}
            onValueChange={(value) =>
              setFormData({ ...formData, bloodGroup: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Emergency Contact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Contact Name</Label>
            <Input
              id="emergencyName"
              value={formData.emergencyContactName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergencyContactName: e.target.value,
                })
              }
              placeholder="Emergency contact name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Phone Number</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergencyContactPhone: e.target.value,
                })
              }
              placeholder="Emergency contact phone"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditProfileDialog({
  user,
  onSave,
}: {
  user: typeof mockUser;
  onSave: (data: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSave = (data: any) => {
    onSave(data);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-transparent"
          >
            <PencilSimpleLineIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm
            user={user}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-transparent"
        >
          <PencilSimpleLineIcon className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Profile</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">
          <EditProfileForm
            user={user}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);

  const handleSave = (updatedUser: typeof mockUser) => {
    setUser(updatedUser);
    // Here you would typically make an API call to save the data
    console.log("[v0] Profile updated:", updatedUser);
  };

  const handleMetricUpdate = (updatedMetric: HealthMetricData) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser };

      switch (updatedMetric.type) {
        case "blood-pressure":
          newUser.bloodPressure = {
            ...newUser.bloodPressure,
            systolic: updatedMetric.systolic || newUser.bloodPressure.systolic,
            diastolic:
              updatedMetric.diastolic || newUser.bloodPressure.diastolic,
            status:
              (updatedMetric.status as any) || newUser.bloodPressure.status,
          };
          break;
        case "blood-sugar":
          newUser.bloodSugar = {
            ...newUser.bloodSugar,
            value: (updatedMetric.value as number) || newUser.bloodSugar.value,
            status: (updatedMetric.status as any) || newUser.bloodSugar.status,
          };
          break;
        case "weight":
          newUser.weight = {
            ...newUser.weight,
            value: (updatedMetric.value as number) || newUser.weight.value,
          };
          break;
        case "heart-rate":
          newUser.heartRate = {
            ...newUser.heartRate,
            value: (updatedMetric.value as number) || newUser.heartRate.value,
            status: (updatedMetric.status as any) || newUser.heartRate.status,
          };
          break;
        case "sleep":
          newUser.sleepHours = {
            ...newUser.sleepHours,
            average:
              (updatedMetric.value as number) || newUser.sleepHours.average,
            status: (updatedMetric.status as any) || newUser.sleepHours.status,
          };
          break;
        case "temperature":
          console.log("[v0] Temperature updated:", updatedMetric.value);
          break;
      }

      console.log("[v0] Metric updated:", updatedMetric);
      return newUser;
    });
  };

  const heightInM = user.height.value / 100;
  const bmi = (user.weight.value / (heightInM * heightInM)).toFixed(1);
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "elevated";
    return "high";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0"
            >
              <ArrowLeftIcon size={16} className="sm:w-5 sm:h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Health Profile
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Personal Health Dashboard
              </p>
            </div>
            <EditProfileDialog user={user} onSave={handleSave} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        <div className="bg-gradient-to-br from-card via-card to-muted/10 rounded-2xl shadow-lg border border-border/50 p-4 sm:p-8">
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-1">
                <Avatar className="w-full h-full">
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                    <UserIcon size={32} className="sm:w-10 sm:h-10" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button
                size="sm"
                className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 rounded-full h-8 w-8 sm:h-12 sm:w-12 p-0 shadow-lg group-hover:scale-110 transition-transform"
              >
                <CameraIcon className="w-3 h-3 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="text-center space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {user.name}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {user.age} years old • {user.gender}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <DropIcon className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-600">
                    {user.bloodGroup}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50">
          <div className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">
                  Key Health Metrics
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Your primary health indicators
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <HealthMetricCard
              title="Blood Pressure"
              value={`${user.bloodPressure.systolic}/${user.bloodPressure.diastolic}`}
              unit="mmHg"
              icon={
                <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              }
              lastChecked={user.bloodPressure.lastChecked}
              status={user.bloodPressure.status}
              trend="stable"
              metricData={{
                type: "blood-pressure",
                title: "Blood Pressure",
                systolic: user.bloodPressure.systolic,
                diastolic: user.bloodPressure.diastolic,
                status: user.bloodPressure.status,
              }}
              onEdit={handleMetricUpdate}
            />
            <HealthMetricCard
              title="Blood Sugar"
              value={user.bloodSugar.value}
              unit={user.bloodSugar.unit}
              icon={
                <DropIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              }
              lastChecked={user.bloodSugar.lastChecked}
              status={user.bloodSugar.status}
              trend="down"
              metricData={{
                type: "blood-sugar",
                title: "Blood Sugar",
                value: user.bloodSugar.value,
                unit: user.bloodSugar.unit,
                status: user.bloodSugar.status,
              }}
              onEdit={handleMetricUpdate}
            />
            <HealthMetricCard
              title="Weight"
              value={user.weight.value}
              unit={user.weight.unit}
              icon={
                <ScalesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              }
              lastChecked={user.weight.lastRecorded}
              trend="stable"
              metricData={{
                type: "weight",
                title: "Weight",
                value: user.weight.value,
                unit: user.weight.unit,
              }}
              onEdit={handleMetricUpdate}
            />
            <HealthMetricCard
              title="BMI"
              value={bmi}
              icon={
                <ScalesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              }
              lastChecked="Calculated"
              status={getBMIStatus(Number.parseFloat(bmi))}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50">
          <div className="p-4 sm:p-6 border-b border-border/50">
            <h3 className="text-lg sm:text-xl font-bold">Additional Metrics</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Comprehensive health monitoring
            </p>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <HealthMetricCard
              title="Heart Rate"
              value={user.heartRate.value}
              unit={user.heartRate.unit}
              icon={
                <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
              }
              lastChecked="Resting"
              status={user.heartRate.status}
              metricData={{
                type: "heart-rate",
                title: "Heart Rate",
                value: user.heartRate.value,
                unit: user.heartRate.unit,
                status: user.heartRate.status,
              }}
              onEdit={handleMetricUpdate}
            />
            <HealthMetricCard
              title="Sleep Quality"
              value={user.sleepHours.average}
              unit="hrs/night"
              icon={
                <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
              }
              lastChecked="Weekly avg"
              status={user.sleepHours.status}
              metricData={{
                type: "sleep",
                title: "Sleep Quality",
                value: user.sleepHours.average,
                unit: "hrs/night",
                status: user.sleepHours.status,
              }}
              onEdit={handleMetricUpdate}
            />
            <HealthMetricCard
              title="Temperature"
              value="98.6°F"
              icon={
                <ThermometerIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              }
              lastChecked={user.temperature.lastRecorded}
              status="normal"
              metricData={{
                type: "temperature",
                title: "Temperature",
                value: "98.6",
                status: "normal",
              }}
              onEdit={handleMetricUpdate}
            />
            <HealthMetricCard
              title="Cholesterol"
              value="Pending"
              icon={
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              }
              lastChecked={user.cholesterol.lastChecked}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50">
          <div className="p-4 sm:p-6 border-b border-border/50">
            <h3 className="text-lg sm:text-xl font-bold">
              Medication Overview
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track your medication adherence
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <p className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {user.activeMedications}
                </p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Active Medications
                </p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <p className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                  {user.adherenceRate}%
                </p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Adherence Rate
                </p>
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Last medication taken:{" "}
                <span className="font-semibold text-foreground">
                  {user.lastMedTaken}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50">
          <div className="p-4 sm:p-6 border-b border-border/50">
            <h3 className="text-lg sm:text-xl font-bold">Emergency Contact</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Quick access in case of emergency
            </p>
          </div>
          <EmergencyContactCard
            name={user.emergencyContact.name}
            phone={user.emergencyContact.phone}
          />
        </div>

        <div className="h-4 sm:h-8"></div>
      </div>
    </div>
  );
}
