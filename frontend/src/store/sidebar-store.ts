import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  setMobile: (mobile: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  isOpen: true,
  isMobile: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setMobile: (mobile) => set({ isMobile: mobile }),
}));
