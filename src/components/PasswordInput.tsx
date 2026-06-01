"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Check, X, Info } from "lucide-react";
import { validatePassword, getPasswordRequirements } from "@/lib/validation";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
  showRequirements?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  name = "password",
  required = true,
  className = "",
  id,
  disabled = false,
  showRequirements = false,
  onValidationChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const requirements = getPasswordRequirements();

  useEffect(() => {
    const err = validatePassword(value);
    setError(err);
    if (onValidationChange) {
      onValidationChange(err === "" && value.length > 0);
    }
  }, [value, onValidationChange]);

  return (
    <div className="space-y-3">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`appearance-none block w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 transition-all outline-none font-medium text-gray-700 dark:text-slate-200 ${
            value && error && showRequirements
              ? "border-red-200 dark:border-red-900 focus:ring-red-100 dark:focus:ring-red-900/20 focus:border-red-500" 
              : "border-gray-100 dark:border-slate-800 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500"
          } ${disabled ? "opacity-50" : ""} ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showRequirements && value.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            <Info size={12} />
            Password Requirements
          </div>
          <div className="grid grid-cols-1 gap-2">
            {requirements.map((req, i) => {
              const isMet = (i === 0 && value.length >= 6) || 
                            (i === 1 && /^[a-zA-Z0-9]+$/.test(value)) ||
                            (i === 2 && !/\s/.test(value) && /^[a-zA-Z0-9]+$/.test(value)) ||
                            (i === 3 && true); // Mixed case always allowed
              
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${isMet ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-slate-800 text-gray-400"}`}>
                    {isMet ? <Check size={10} strokeWidth={4} /> : <div className="w-1 h-1 bg-current rounded-full" />}
                  </div>
                  <span className={`text-xs font-bold transition-colors ${isMet ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                    {req}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}

