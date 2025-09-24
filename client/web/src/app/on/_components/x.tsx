"use client";

import type { WheelPickerOption } from "@/components/wheel-picker";
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker";
import { useState, useEffect } from "react";

const monthOptions: WheelPickerOption[] = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const createDayOptions = (daysInMonth: number): WheelPickerOption[] =>
  Array.from({ length: daysInMonth }, (_, i) => {
    const value = i + 1;
    return {
      label: value.toString(),
      value: value.toString(),
    };
  });

const createYearOptions = (): WheelPickerOption[] => {
  const currentYear = new Date().getFullYear();
  const startYear = 1920;
  return Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
    const year = currentYear - i; // Start from current year and go backwards
    return {
      label: year.toString(),
      value: year.toString(),
    };
  });
};

const yearOptions = createYearOptions();

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

interface DateOfBirthPickerProps {
  onDateChange?: (date: { month: number; day: number; year: number }) => void;
}

export function DateOfBirthPicker({ onDateChange }: DateOfBirthPickerProps) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dayOptions, setDayOptions] = useState(createDayOptions(31));

  useEffect(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    setDayOptions(createDayOptions(daysInMonth));

    // Adjust selected day if it's beyond the days in the new month
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  useEffect(() => {
    onDateChange?.({
      month: selectedMonth,
      day: selectedDay,
      year: selectedYear,
    });
  }, [selectedMonth, selectedDay, selectedYear, onDateChange]);

  return (
    <div className="w-80">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-center">Date of Birth</h3>
        <p className="text-sm text-muted-foreground text-center">
          Select your birth date
        </p>
      </div>
      <WheelPickerWrapper>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Month</span>
          <WheelPicker
            options={monthOptions}
            defaultValue="1"
            // onChange={(value) => setSelectedMonth(Number.parseInt(value))}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Day</span>
          <WheelPicker
            options={dayOptions}
            defaultValue="1"
            // onChange={(value) => setSelectedDay(Number.parseInt(value))}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Year</span>
          <WheelPicker
            options={yearOptions}
            defaultValue={new Date().getFullYear().toString()}
            // onChange={(value) => setSelectedYear(Number.parseInt(value))}
          />
        </div>
      </WheelPickerWrapper>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Selected: {monthOptions[selectedMonth - 1]?.label} {selectedDay},{" "}
        {selectedYear}
      </div>
    </div>
  );
}
