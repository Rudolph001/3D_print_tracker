import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { parseTimeToHours, formatPrintTime, isValidTimeFormat } from "@/lib/time-utils";

interface TimeInputProps {
  value: number; // decimal hours
  onChange: (hours: number) => void;
  placeholder?: string;
  className?: string;
}

export function TimeInput({ value, onChange, placeholder = "0:00:00", className }: TimeInputProps) {
  const [timeString, setTimeString] = useState<string>("");
  const [isValid, setIsValid] = useState(true);

  // Convert decimal hours to time string when value changes
  useEffect(() => {
    if (value > 0) {
      setTimeString(formatPrintTime(value));
    } else {
      setTimeString("");
    }
  }, [value]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setTimeString(inputValue);

    if (inputValue === "") {
      setIsValid(true);
      onChange(0);
      return;
    }

    const valid = isValidTimeFormat(inputValue);
    setIsValid(valid);

    if (valid) {
      const hours = parseTimeToHours(inputValue);
      onChange(hours);
    }
  };

  return (
    <Input
      type="text"
      value={timeString}
      onChange={handleTimeChange}
      placeholder={placeholder}
      className={`${className} ${!isValid ? 'border-red-500' : ''}`}
    />
  );
}