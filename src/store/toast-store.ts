import { create } from "zustand";

export type Toast = { id: string; message: string; tone?: "default" | "success" | "error" };

type ToastState = {
  toasts: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "default") =>
    set((state) => {
      const id = crypto.randomUUID();
      setTimeout(() => {
        useToastStore.getState().dismiss(id);
      }, 3200);
      return { toasts: [...state.toasts, { id, message, tone }] };
    }),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
