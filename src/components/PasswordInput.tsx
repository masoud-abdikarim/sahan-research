"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  name = "password",
  required = true,
  className = "",
  id,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
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
        className={`appearance-none block w-full pl-10 pr-12 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200 ${className}`}
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
  );
}
