"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${isDestructive ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-2xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 px-6 py-3.5 rounded-2xl text-sm font-black text-white transition-all shadow-lg ${
                isDestructive 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-100/50 dark:shadow-red-950/50" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100/50 dark:shadow-indigo-950/50"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
