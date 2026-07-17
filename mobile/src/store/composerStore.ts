import { create } from 'zustand';

type ComposerState = {
  isOpen: boolean;
  initialData: { id: string; type: any; data: any } | null;
  open: (initialData?: { id: string; type: any; data: any } | null) => void;
  close: () => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  isOpen: false,
  initialData: null,
  open: (payload = null) => {
    if (payload && typeof payload === 'object' && 'nativeEvent' in payload) {
      set({ isOpen: true, initialData: null });
    } else {
      set({ isOpen: true, initialData: payload as any });
    }
  },
  close: () => set({ isOpen: false, initialData: null }),
}));
