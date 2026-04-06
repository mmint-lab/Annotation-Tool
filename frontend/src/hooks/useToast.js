import React, { useState } from "react";
import { X } from "lucide-react";

export function useToast(duration = 4000) {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };
  return { toast, showToast, setToast };
}

export function ToastContainer({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white flex items-center gap-2 ${
        toast.type === "success" ? "bg-green-600" :
        toast.type === "error" ? "bg-red-600" :
        toast.type === "info" ? "bg-blue-600" : "bg-gray-600"
      }`}
      role="alert"
    >
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80" aria-label="Dismiss">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
