import { AuthUserDTO } from "@shopee-cashback/shared";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { fetchMe } from "../api/auth.api";
import { getToken, setToken } from "../api/client";

interface AuthContextValue {
  user: AuthUserDTO | null;
  loading: boolean;
  signIn: (token: string, user: AuthUserDTO) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  function signIn(token: string, nextUser: AuthUserDTO) {
    setToken(token);
    setUser(nextUser);
  }

  function signOut() {
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
