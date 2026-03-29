// frontend/src/store/localeStore.ts
import { create } from 'zustand';

type Locale = 'en' | 'zh' | 'ja';

interface LocaleState {
  locale: Locale;
  setLocale: (loc: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en', // 💡 默认英文，尽显国际化极客范
  setLocale: (loc) => set({ locale: loc }),
}));