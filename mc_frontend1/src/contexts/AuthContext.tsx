import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  showGuestModal: boolean;
  setShowGuestModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const initialized = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const popupShown = sessionStorage.getItem("guestModalShown");

      if (!token) {
        if (!popupShown) {
          setShowGuestModal(true);
        }
        setLoading(false);
        return;
      }

      let userData: User | null = null;
      if (savedUser) {
        try {
          userData = JSON.parse(savedUser);
          if (userData) {
            userData.role = userData.email === "admin@mobilecare.com" ? "admin" : "user";
          }
        } catch (e) {
          userData = null;
        }
      }

      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
      }

      try {
        const response = await api<{ valid: boolean; user?: User }>("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.valid && response.user) {
          const normalizedUser = {
            ...response.user,
            role: response.user.email === "admin@mobilecare.com" ? "admin" : "user"
          };
          setIsAuthenticated(true);
          setUser(normalizedUser);
          localStorage.setItem("user", JSON.stringify(normalizedUser));
        } else if (!userData) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUser(null);
          if (!popupShown) {
            setShowGuestModal(true);
          }
        }
      } catch (error) {
        if (!userData) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUser(null);
          if (!popupShown) {
            setShowGuestModal(true);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User) => {
    const normalizedUser = {
      ...userData,
      role: userData.email === "admin@mobilecare.com" ? "admin" : "user"
    };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setIsAuthenticated(true);
    setUser(normalizedUser);
    setShowGuestModal(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");

    sessionStorage.removeItem("intendedRoute");
    sessionStorage.removeItem("guestModalShown");

    setIsAuthenticated(false);
    setUser(null);

    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
        showGuestModal,
        setShowGuestModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
