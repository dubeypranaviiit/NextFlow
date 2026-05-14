"use client";

import { create } from "zustand";

type UiStore = {
 
  search: string;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  commandOpen: boolean;
  
  countdownSeconds: number;

  loadingVisible: boolean;
  loadingMessage: string;

 
  setSearch: (search: string) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setSettingsOpen: (settingsOpen: boolean) => void;
  setCommandOpen: (commandOpen: boolean) => void;
  setLoadingVisible: (visible: boolean, message?: string) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  search: "",
  sidebarOpen: true,
  settingsOpen: false,
  commandOpen: false,
  countdownSeconds: 14 * 3600 + 39 * 60 + 21,
  loadingVisible: false,
  loadingMessage: "Live like it's heaven on earth 🌏",

  setSearch: (search) => set({ search }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setLoadingVisible: (visible, message) =>
    set({ loadingVisible: visible, ...(message ? { loadingMessage: message } : {}) })
}));
