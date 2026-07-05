"use client";

import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // 3.5s 后自动消失
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** 便捷调用（可在非组件内使用） */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "error" }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "warning" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "default" }),
};
