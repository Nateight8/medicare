"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowLeft, User, Users, Heart } from "lucide-react";

type Role = "personal" | "caregiver" | null;
type Step = "role" | "profile" | "additional" | "welcome";

interface PersonalProfile {
  name: string;
  dateOfBirth: string;
  gender: string;
}

interface Dependent {
  name: string;
  dateOfBirth: string;
  gender: string;
  relationship: string;
  notes: string;
}

interface FormData {
  role: Role;
  profile: PersonalProfile;
  dependents: Dependent[];
}

export default function MediTrackOnboarding() {
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const [formData, setFormData] = useState<FormData>({
    role: null,
    profile: { name: "", dateOfBirth: "", gender: "" },
    dependents: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [currentDependent, setCurrentDependent] = useState<Dependent>({
    name: "",
    dateOfBirth: "",
    gender: "",
    relationship: "",
    notes: "",
  });

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.profile.name.trim()) newErrors.name = "Name is required";
    if (!formData.profile.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDependent = () => {
    const newErrors: Record<string, string> = {};
    if (showDependentForm) {
      if (!currentDependent.name.trim())
        newErrors.dependentName = "Name is required";
      if (!currentDependent.dateOfBirth)
        newErrors.dependentDateOfBirth = "Date of birth is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRoleSelect = (role: Role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleProfileChange = (field: keyof PersonalProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleDependentChange = (field: keyof Dependent, value: string) => {
    setCurrentDependent((prev) => ({ ...prev, [field]: value }));
    if (errors[`dependent${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev) => ({
        ...prev,
        [`dependent${field.charAt(0).toUpperCase() + field.slice(1)}`]: "",
      }));
    }
  };

  const addDependent = () => {
    if (validateDependent()) {
      setFormData((prev) => ({
        ...prev,
        dependents: [...prev.dependents, currentDependent],
      }));
      setCurrentDependent({
        name: "",
        dateOfBirth: "",
        gender: "",
        relationship: "",
        notes: "",
      });
      setShowDependentForm(false);
    }
  };

  const handleNext = () => {
    if (currentStep === "role" && formData.role) {
      setCurrentStep("profile");
    } else if (currentStep === "profile") {
      if (validateProfile()) {
        if (formData.role === "caregiver") {
          setCurrentStep("additional");
        } else {
          setCurrentStep("welcome");
        }
      }
    } else if (currentStep === "additional") {
      setCurrentStep("welcome");
    }
  };

  const handleBack = () => {
    if (currentStep === "profile") {
      setCurrentStep("role");
    } else if (currentStep === "additional") {
      setCurrentStep("profile");
    } else if (currentStep === "welcome") {
      setCurrentStep(formData.role === "caregiver" ? "additional" : "profile");
    }
  };

  const getProgressDots = () => {
    const totalSteps = formData.role === "caregiver" ? 4 : 3;
    const currentStepIndex = [
      "role",
      "profile",
      "additional",
      "welcome",
    ].indexOf(currentStep);

    return Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full transition-colors ${
          i <= currentStepIndex ? "bg-primary" : "bg-muted"
        }`}
      />
    ));
  };

  const getProgressText = () => {
    if (currentStep === "role") return "";
    if (currentStep === "profile") {
      return formData.role === "caregiver" ? "Step 1 of 2" : "Step 1 of 1";
    }
    if (currentStep === "additional") return "Step 2 of 2";
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">MediTrack</h1>
          </div>

          {currentStep === "role" && (
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              How will you use MediTrack?
            </h2>
          )}

          {currentStep === "profile" && (
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Set up your profile
              </h2>
              {getProgressText() && (
                <p className="text-base text-muted-foreground">
                  {getProgressText()}
                </p>
              )}
            </>
          )}

          {currentStep === "additional" && (
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Add another family member?
              </h2>
              <p className="text-base text-muted-foreground">
                {getProgressText()}
              </p>
            </>
          )}

          {currentStep === "welcome" && (
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to MediTrack!
            </h2>
          )}
        </div>
        <div className="w-full">
          <>
            <>
              {/* Role Selection Step */}
              {currentStep === "role" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                    <Card
                      className={`cursor-pointer aspect-[9/10] transition-all hover:shadow-lg ${
                        formData.role === "personal"
                          ? "border-primary bg-muted"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => handleRoleSelect("personal")}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="mb-6">
                          <User className="w-16 h-16 mx-auto text-primary mb-4" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          Personal Use
                        </h3>
                        <p className="text-base text-muted-foreground mb-3">
                          Track only your own medications
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Perfect for managing your personal medication schedule
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer aspect-[9/10] transition-all hover:shadow-lg ${
                        formData.role === "caregiver"
                          ? "border-primary bg-muted"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => handleRoleSelect("caregiver")}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="mb-6">
                          <Users className="w-16 h-16 mx-auto text-primary mb-4" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          Caregiver / Family Use
                        </h3>
                        <p className="text-base text-muted-foreground mb-3">
                          Track your meds and manage medications for others
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ideal for parents, caregivers, or family coordinators
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Profile Setup Step */}
              {currentStep === "profile" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">
                      Your Profile
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-foreground"
                        >
                          Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.profile.name}
                          onChange={(e) =>
                            handleProfileChange("name", e.target.value)
                          }
                          className={`bg-background border-border ${
                            errors.name ? "border-destructive" : ""
                          }`}
                          placeholder="Enter your name"
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="dateOfBirth"
                          className="text-sm font-medium text-foreground"
                        >
                          Date of Birth *
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.profile.dateOfBirth}
                          onChange={(e) =>
                            handleProfileChange("dateOfBirth", e.target.value)
                          }
                          className={`bg-background border-border ${
                            errors.dateOfBirth ? "border-destructive" : ""
                          }`}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-xs text-destructive">
                            {errors.dateOfBirth}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="gender"
                        className="text-sm font-medium text-foreground"
                      >
                        Gender (optional)
                      </Label>
                      <Select
                        value={formData.profile.gender}
                        onValueChange={(value) =>
                          handleProfileChange("gender", value)
                        }
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.role === "caregiver" && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">
                          Add a family member or dependent (optional)
                        </h3>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setShowDependentForm(!showDependentForm)
                          }
                          className="text-sm"
                        >
                          {showDependentForm ? "Cancel" : "Add Person"}
                        </Button>
                      </div>

                      {showDependentForm && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-foreground">
                                Name *
                              </Label>
                              <Input
                                value={currentDependent.name}
                                onChange={(e) =>
                                  handleDependentChange("name", e.target.value)
                                }
                                className={`bg-background border-border ${
                                  errors.dependentName
                                    ? "border-destructive"
                                    : ""
                                }`}
                                placeholder="Enter name"
                              />
                              {errors.dependentName && (
                                <p className="text-xs text-destructive">
                                  {errors.dependentName}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-foreground">
                                Date of Birth *
                              </Label>
                              <Input
                                type="date"
                                value={currentDependent.dateOfBirth}
                                onChange={(e) =>
                                  handleDependentChange(
                                    "dateOfBirth",
                                    e.target.value
                                  )
                                }
                                className={`bg-background border-border ${
                                  errors.dependentDateOfBirth
                                    ? "border-destructive"
                                    : ""
                                }`}
                              />
                              {errors.dependentDateOfBirth && (
                                <p className="text-xs text-destructive">
                                  {errors.dependentDateOfBirth}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-foreground">
                                Gender (optional)
                              </Label>
                              <Select
                                value={currentDependent.gender}
                                onValueChange={(value) =>
                                  handleDependentChange("gender", value)
                                }
                              >
                                <SelectTrigger className="bg-background border-border">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer-not-to-say">
                                    Prefer not to say
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-foreground">
                                Relationship
                              </Label>
                              <Select
                                value={currentDependent.relationship}
                                onValueChange={(value) =>
                                  handleDependentChange("relationship", value)
                                }
                              >
                                <SelectTrigger className="bg-background border-border">
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="child">Child</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              Notes (optional)
                            </Label>
                            <Textarea
                              value={currentDependent.notes}
                              onChange={(e) =>
                                handleDependentChange("notes", e.target.value)
                              }
                              className="bg-background border-border"
                              placeholder="Any additional notes..."
                              rows={3}
                            />
                          </div>

                          <Button onClick={addDependent} className="w-full">
                            Add Person
                          </Button>
                        </div>
                      )}

                      {formData.dependents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">
                            Added Family Members:
                          </h4>
                          {formData.dependents.map((dependent, index) => (
                            <div
                              key={index}
                              className="p-3 bg-muted rounded-lg"
                            >
                              <p className="font-medium text-foreground">
                                {dependent.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {dependent.relationship &&
                                  `${dependent.relationship} • `}
                                {new Date(
                                  dependent.dateOfBirth
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        You can always add more family members later from your
                        dashboard
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Dependents Step */}
              {currentStep === "additional" && (
                <div className="space-y-6 text-center">
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDependentForm(true)}
                      className="w-full md:w-auto"
                    >
                      Add Another Person
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep("welcome")}
                      className="w-full md:w-auto text-muted-foreground"
                    >
                      Skip for Now
                    </Button>
                  </div>

                  {showDependentForm && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg text-left">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">
                            Name *
                          </Label>
                          <Input
                            value={currentDependent.name}
                            onChange={(e) =>
                              handleDependentChange("name", e.target.value)
                            }
                            className={`bg-background border-border ${
                              errors.dependentName ? "border-destructive" : ""
                            }`}
                            placeholder="Enter name"
                          />
                          {errors.dependentName && (
                            <p className="text-xs text-destructive">
                              {errors.dependentName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">
                            Date of Birth *
                          </Label>
                          <Input
                            type="date"
                            value={currentDependent.dateOfBirth}
                            onChange={(e) =>
                              handleDependentChange(
                                "dateOfBirth",
                                e.target.value
                              )
                            }
                            className={`bg-background border-border ${
                              errors.dependentDateOfBirth
                                ? "border-destructive"
                                : ""
                            }`}
                          />
                          {errors.dependentDateOfBirth && (
                            <p className="text-xs text-destructive">
                              {errors.dependentDateOfBirth}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">
                            Gender (optional)
                          </Label>
                          <Select
                            value={currentDependent.gender}
                            onValueChange={(value) =>
                              handleDependentChange("gender", value)
                            }
                          >
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">
                                Prefer not to say
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">
                            Relationship
                          </Label>
                          <Select
                            value={currentDependent.relationship}
                            onValueChange={(value) =>
                              handleDependentChange("relationship", value)
                            }
                          >
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                          Notes (optional)
                        </Label>
                        <Textarea
                          value={currentDependent.notes}
                          onChange={(e) =>
                            handleDependentChange("notes", e.target.value)
                          }
                          className="bg-background border-border"
                          placeholder="Any additional notes..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addDependent} className="flex-1">
                          Add Person
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowDependentForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Welcome Step */}
              {currentStep === "welcome" && (
                <div className="space-y-6 text-center">
                  <div className="space-y-4">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    <h3 className="text-xl font-semibold text-foreground">
                      Your account is ready!
                    </h3>

                    {formData.role === "personal" ? (
                      <p className="text-base text-muted-foreground">
                        Start by adding your first medication
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground">
                        Manage medications for yourself and{" "}
                        {formData.dependents.length} family member
                        {formData.dependents.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <Button size="lg" className="w-full md:w-auto">
                    Go to Dashboard
                  </Button>
                </div>
              )}

              <div className="flex items-center mt-8 w-full justify-between">
                {/* Progress Dots */}
                {currentStep !== "welcome" && (
                  <div className="flex justify-center gap-2 mt-8">
                    {getProgressDots()}
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep !== "welcome" && (
                  <div className="space-x-4 flex items-center">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="text-muted-foreground rounded-full"
                      disabled={currentStep === "role"}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={
                        (currentStep === "role" && !formData.role) ||
                        (currentStep === "profile" &&
                          (!formData.profile.name ||
                            !formData.profile.dateOfBirth))
                      }
                      className={
                        currentStep === "role" && !formData.role
                          ? "opacity-0 rounded-full pointer-events-none"
                          : "rounded-full"
                      }
                    >
                      {currentStep === "profile" && formData.role === "personal"
                        ? "Complete Setup"
                        : "Continue"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          </>
        </div>
      </div>
    </div>
  );
}
