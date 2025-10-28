import React, { createContext, useContext, useMemo, useState } from "react";

type Role = string;
export interface UserSession {
  id: string;
  roles: Role[];
  assignments: string[];
  delegatedTeams: string[];
}

interface AuthContextValue {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
