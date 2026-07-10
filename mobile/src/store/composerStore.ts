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
  open: (initialData = null) => set({ isOpen: true, initialData }),
  close: () => set({ isOpen: false, initialData: null }),
}));
