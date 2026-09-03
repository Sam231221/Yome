"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import type { AppUserInfo } from "@/lib/auth/userInfo";

interface AuthState {
  newUser: boolean;
  userInfo: AppUserInfo | undefined;
}

type AuthContextValue = [
  AuthState,
  {
    setNewUser: (value: boolean) => void;
    setUserInfo: (user: AppUserInfo) => void;
  },
];

const AuthStateContext = createContext<AuthContextValue | null>(null);

export const AuthStateProvider = ({ children }: { children: ReactNode }) => {
  const [newUser, setNewUser] = useState(false);
  const [userInfo, setUserInfo] = useState<AppUserInfo | undefined>(undefined);

  return (
    <AuthStateContext.Provider
      value={[{ newUser, userInfo }, { setNewUser, setUserInfo }]}
    >
      {children}
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error("useAuthState must be used within AuthStateProvider");
  }
  return context;
};
