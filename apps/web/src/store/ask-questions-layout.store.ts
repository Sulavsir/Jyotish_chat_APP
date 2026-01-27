import { create } from 'zustand';

interface AskQuestionsLayoutState {
  showExtraInfoCards: boolean;
  setShowExtraInfoCards: (show: boolean) => void;
}

export const useAskQuestionsLayoutStore = create<AskQuestionsLayoutState>((set) => ({
  showExtraInfoCards: false,
  setShowExtraInfoCards: (show) => set({ showExtraInfoCards: show }),
}));

