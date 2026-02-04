import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_PROFILE_ID = 'me';
const PERSIST_KEY = 'chat-profile-store';

/** API-ready birth details (dateOfBirth, timeOfBirth, placeOfBirth, gender) */
export type CachedBirthDetails = Record<string, string>;

interface ChatProfileState {
  selectedProfileByChatKey: Record<string, string>;
  birthDetailsByChatKey: Record<string, CachedBirthDetails>;
  setSelectedProfileForChat: (chatKey: string, profileId: string) => void;
  getSelectedProfileForChat: (chatKey: string) => string;
  setBirthDetailsForChat: (chatKey: string, birthDetails: CachedBirthDetails) => void;
  getBirthDetailsForChat: (chatKey: string) => CachedBirthDetails | undefined;
  migrateSelectionToChatId: (fromKey: string, toChatId: string) => void;
}

export const useChatProfileStore = create<ChatProfileState>()(
  persist(
    (set, get) => ({
      selectedProfileByChatKey: {},
      birthDetailsByChatKey: {},

      setSelectedProfileForChat: (chatKey, profileId) =>
        set((state) => ({
          selectedProfileByChatKey: {
            ...state.selectedProfileByChatKey,
            [chatKey]: profileId,
          },
          // Invalidate cache when profile changes so next send recomputes
          birthDetailsByChatKey: (() => {
            const next = { ...state.birthDetailsByChatKey };
            delete next[chatKey];
            return next;
          })(),
        })),

      getSelectedProfileForChat: (chatKey) =>
        get().selectedProfileByChatKey[chatKey] ?? DEFAULT_PROFILE_ID,

      setBirthDetailsForChat: (chatKey, birthDetails) =>
        set((state) => ({
          birthDetailsByChatKey: {
            ...state.birthDetailsByChatKey,
            [chatKey]: birthDetails,
          },
        })),

      getBirthDetailsForChat: (chatKey) => get().birthDetailsByChatKey[chatKey],

      migrateSelectionToChatId: (fromKey, toChatId) => {
        const profileId = get().selectedProfileByChatKey[fromKey] ?? DEFAULT_PROFILE_ID;
        const birthDetails = get().birthDetailsByChatKey[fromKey];
        set((state) => ({
          selectedProfileByChatKey: {
            ...state.selectedProfileByChatKey,
            [toChatId]: profileId,
          },
          ...(birthDetails && {
            birthDetailsByChatKey: {
              ...state.birthDetailsByChatKey,
              [toChatId]: birthDetails,
            },
          }),
        }));
      },
    }),
    {
      name: PERSIST_KEY,
      partialize: (state) => ({
        selectedProfileByChatKey: state.selectedProfileByChatKey,
        birthDetailsByChatKey: state.birthDetailsByChatKey,
      }),
    }
  )
);
