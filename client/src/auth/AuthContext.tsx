import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api";
export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    code: "ADMIN" | "DEPARTMENT_HEAD" | "LAPTOP_RENTAL";
    name: string;
  };
  department: {
    id: number;
    name: string;
    code: string;
  } | null;
};
type AuthState = {
  accessToken: string | null;
  user: AuthenticatedUser | null;
  loading: boolean;
  signIn: (accessToken: string, user: AuthenticatedUser) => void;
  signOut: () => void;
};
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const nativeFetch = useRef(window.fetch.bind(window));
  useEffect(() => {
    void nativeFetch
      .current(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
      .then(async (response) => (response.ok ? await response.json() : null))
      .then((payload) => {
        if (payload?.accessToken && payload?.user) {
          setAccessToken(payload.accessToken);
          setUser(payload.user);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const originalFetch = nativeFetch.current;
    window.fetch = (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (
        !accessToken ||
        !url.startsWith(`${API_BASE_URL}/api/`) ||
        url.startsWith(`${API_BASE_URL}/api/auth/`)
      )
        return originalFetch(input, init);
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      headers.set("Authorization", `Bearer ${accessToken}`);
      return originalFetch(input, {
        ...init,
        headers,
        credentials: init?.credentials ?? "include",
      });
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [accessToken]);
  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      signIn: (token: string, nextUser: AuthenticatedUser) => {
        setAccessToken(token);
        setUser(nextUser);
        setLoading(false);
      },
      signOut: () => {
        setAccessToken(null);
        setUser(null);
        setLoading(false);
      },
    }),
    [accessToken, user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
