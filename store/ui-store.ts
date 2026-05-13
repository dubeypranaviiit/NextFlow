"use client";

import { create } from "zustand";

type UiStore = {
  search: string;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  commandOpen: boolean;
  setSearch: (search: string) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setSettingsOpen: (settingsOpen: boolean) => void;
  setCommandOpen: (commandOpen: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  search: "",
  sidebarOpen: true,
  settingsOpen: false,
  commandOpen: false,
  setSearch: (search) => set({ search }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen })
}));
