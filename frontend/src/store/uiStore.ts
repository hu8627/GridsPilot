import { create } from 'zustand';

type ViewType = 
  | 'workspace' | 'chat' | 'workbench'
  | 'studio' | 'components'
   | 'agents' | 'triggers' | 'prompts' | 'skills' | 'models'
  | 'schemas' | 'assets' | 'integrations'
  | 'rules' | 'guards' | 'monitors'
  | 'traces' | 'cases' | 'tickets' | 'ledger';

interface UIState {
  currentView: ViewType;
  activeFlowId: string | null;
  setCurrentView: (view: ViewType) => void;
  setActiveFlow: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'workspace', // 默认进入多智能体协同群聊
  activeFlowId: null,
  
  setCurrentView: (view) => set((state) => ({ 
    currentView: view, 
    // 💡 只有切到 Studio 时保留图纸记忆，切到其他页面清除画板上下文
    activeFlowId: view === 'studio' ? state.activeFlowId : null 
  })),
  
  setActiveFlow: (id) => set({ activeFlowId: id }),
}));