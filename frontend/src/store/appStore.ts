import { create } from 'zustand';

interface AppState {
    expertMode: boolean;
    toggleExpertMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    expertMode: false,
    toggleExpertMode: () => set((state) => ({ expertMode: !state.expertMode })),
}));
