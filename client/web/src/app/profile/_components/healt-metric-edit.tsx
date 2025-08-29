"use client";

import { useState } from "react";
import { PencilSimpleLineIcon } from "@phosphor-icons/react";
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

export interface HealthMetricData {
  type:
    | "blood-pressure"
    | "blood-sugar"
    | "weight"
    | "heart-rate"
    | "sleep"
    | "temperature"
    | "cholesterol";
  title: string;
  value?: number | string;
  unit?: string;
  status?: "normal" | "elevated" | "high" | "good" | "fair" | "poor";
  systolic?: number;
  diastolic?: number;
}

interface HealthMetricEditProps {
  metric: HealthMetricData;
  onSave: (updatedMetric: HealthMetricData) => void;
}

function EditForm({
  metric,
  onSave,
  onClose,
}: HealthMetricEditProps & { onClose: () => void }) {
  const [formData, setFormData] = useState<HealthMetricData>(metric);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderFields = () => {
    switch (metric.type) {
      case "blood-pressure":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic">Systolic</Label>
                <Input
                  id="systolic"
                  type="number"
                  value={formData.systolic || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      systolic: Number(e.target.value),
                    })
                  }
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Diastolic</Label>
                <Input
                  id="diastolic"
                  type="number"
                  value={formData.diastolic || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diastolic: Number(e.target.value),
                    })
                  }
                  placeholder="80"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-status">Status</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "blood-sugar":
      case "weight":
      case "heart-rate":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <div className="flex gap-2">
                <Input
                  id="value"
                  type="number"
                  value={formData.value || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, value: Number(e.target.value) })
                  }
                  placeholder="Enter value"
                  className="flex-1"
                />
                {formData.unit && (
                  <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                    {formData.unit}
                  </div>
                )}
              </div>
            </div>
            {(metric.type === "blood-sugar" ||
              metric.type === "heart-rate") && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="elevated">Elevated</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case "sleep":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sleep-hours">Average Hours per Night</Label>
              <Input
                id="sleep-hours"
                type="number"
                step="0.1"
                value={formData.value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
                placeholder="7.2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep-status">Sleep Quality</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "temperature":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temp-value">Temperature</Label>
              <div className="flex gap-2">
                <Input
                  id="temp-value"
                  type="number"
                  step="0.1"
                  value={formData.value || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="98.6"
                  className="flex-1"
                />
                <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                  °F
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-status">Status</Label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="general-value">Value</Label>
              <Input
                id="general-value"
                value={formData.value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder="Enter value"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Edit {metric.title}</h3>
        <p className="text-sm text-muted-foreground">
          Update your {metric.title.toLowerCase()} reading
        </p>
      </div>

      {renderFields()}

      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave} className="flex-1">
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function HealthMetricEdit({ metric, onSave }: HealthMetricEditProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleClose = () => setOpen(false);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full hover:bg-muted/80"
          >
            <PencilSimpleLineIcon className="w-2 h-2 sm:w-3 sm:h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Edit {metric.title}</DialogTitle>
          </DialogHeader>
          <EditForm metric={metric} onSave={onSave} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full hover:bg-muted/80"
        >
          <PencilSimpleLineIcon className="w-2 h-2 sm:w-3 sm:h-3" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="sr-only">Edit {metric.title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <EditForm metric={metric} onSave={onSave} onClose={handleClose} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
