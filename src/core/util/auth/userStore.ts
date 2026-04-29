import { create } from "zustand";
import type { UserInfo } from "../types/generalTypes";

interface UserState {
  user: UserInfo | null;
  setUser: (u: UserInfo | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
