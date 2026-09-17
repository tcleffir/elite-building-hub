import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { Building, mockBuildings, mockUsers, User, ModuleAccessMap } from "@/lib/mock-data";

const CURRENT_USER_STORAGE_KEY = "luxcondo_current_user_id";

interface AppContextType {
  user: User;
  selectedBuilding: Building;
  setSelectedBuildingId: (id: string) => void;
  isDark: boolean;
  toggleDark: () => void;
  switchUser: (userId: string) => void;
  isModuleBlocked: (moduleKey: string) => boolean;
  setModuleAccess: (userId: string, moduleKey: string, enabled: boolean) => void;
  allUsers: User[];
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => [...mockUsers]);
  const [currentUserId, setCurrentUserId] = useState(() => {
    const savedUserId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return mockUsers.some((u) => u.id === savedUserId) ? savedUserId! : mockUsers[0].id;
  });
  const [selectedBuildingId, setSelectedBuildingId] = useState(mockBuildings[0].id);
  const [isDark, setIsDark] = useState(false);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const user = users.find((u) => u.id === currentUserId) || users[0];
  const selectedBuilding = mockBuildings.find((b) => b.id === selectedBuildingId) || mockBuildings[0];

  const switchUser = (userId: string) => {
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
    setCurrentUserId(userId);
  };

  const isModuleBlocked = useCallback((moduleKey: string) => {
    // Super admin never blocked
    if (user.role === 'super_admin') return false;
    // If no module_access config, module is available (default open)
    if (!user.module_access) return false;
    // Explicitly set to false = blocked
    return user.module_access[moduleKey] === false;
  }, [user]);

  const setModuleAccess = useCallback((userId: string, moduleKey: string, enabled: boolean) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        module_access: { ...u.module_access, [moduleKey]: enabled },
      };
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      user, selectedBuilding, setSelectedBuildingId, isDark, toggleDark, switchUser,
      isModuleBlocked, setModuleAccess, allUsers: users,
    }}>
      {children}
    </AppContext.Provider>
  );
};
