import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, AppState, User, Settings } from '@/types';

// 认证状态管理
interface AuthStore extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: (user: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ isAuthenticated: true, user, token });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ isAuthenticated: false, user: null, token: null });
      },

      updateUser: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },

      checkAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ isAuthenticated: true, user, token });
            return true;
          } catch {
            // 解析失败，清除存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
        
        set({ isAuthenticated: false, user: null, token: null });
        return false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);

// 应用状态管理
interface AppStore extends AppState {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSettings: (settings: Settings) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: false,
      loading: false,
      settings: null,

      setTheme: (theme) => {
        // 应用主题到DOM
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setLoading: (loading) => set({ loading }),
      
      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Memo列表状态管理
interface MemoStore {
  memos: any[];
  selectedMemo: any | null;
  loading: boolean;
  searchTerm: string;
  selectedTag: string | null;
  visibility: 'ALL' | 'PUBLIC' | 'PRIVATE';
  
  setMemos: (memos: any[]) => void;
  addMemo: (memo: any) => void;
  updateMemo: (id: number, memo: any) => void;
  removeMemo: (id: number) => void;
  setSelectedMemo: (memo: any | null) => void;
  setLoading: (loading: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setVisibility: (visibility: 'ALL' | 'PUBLIC' | 'PRIVATE') => void;
  reset: () => void;
}

export const useMemoStore = create<MemoStore>((set) => ({
  memos: [],
  selectedMemo: null,
  loading: false,
  searchTerm: '',
  selectedTag: null,
  visibility: 'ALL',

  setMemos: (memos) => set({ memos }),
  
  addMemo: (memo) => set((state) => ({ memos: [memo, ...state.memos] })),
  
  updateMemo: (id, updatedMemo) => set((state) => ({
    memos: state.memos.map((memo) => memo.id === id ? { ...memo, ...updatedMemo } : memo),
    selectedMemo: state.selectedMemo?.id === id ? { ...state.selectedMemo, ...updatedMemo } : state.selectedMemo
  })),
  
  removeMemo: (id) => set((state) => ({
    memos: state.memos.filter((memo) => memo.id !== id),
    selectedMemo: state.selectedMemo?.id === id ? null : state.selectedMemo
  })),
  
  setSelectedMemo: (memo) => set({ selectedMemo: memo }),
  
  setLoading: (loading) => set({ loading }),
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  
  setVisibility: (visibility) => set({ visibility }),
  
  reset: () => set({
    memos: [],
    selectedMemo: null,
    loading: false,
    searchTerm: '',
    selectedTag: null,
    visibility: 'ALL'
  }),
}));

// 标签状态管理
interface TagStore {
  tags: any[];
  loading: boolean;
  
  setTags: (tags: any[]) => void;
  addTag: (tag: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  loading: false,
  
  setTags: (tags) => set({ tags }),
  
  addTag: (tag) => set((state) => ({
    tags: [...state.tags, tag]
  })),
  
  setLoading: (loading) => set({ loading }),
})); 