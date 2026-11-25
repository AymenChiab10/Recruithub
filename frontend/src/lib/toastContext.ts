import { createContext } from "react";

export type ToastTone = "success" | "error";
export interface ToastContextValue {
  notify: (tone: ToastTone, title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
