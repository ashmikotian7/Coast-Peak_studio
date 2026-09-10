import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, login, signup, setAuthTokens, clearAuthTokens, setUser, clearUser, getUser, logoutAPI, fetchProfileAPI, updateProfileAPI, getAccessToken, isAuthenticated as checkIsAuthenticated } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (email: string, fullName: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, passwordConfirm: string, phoneNumber: string, country: string) => Promise<void>;
  signupWithGoogle: (fullName: string, email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function initAuth() {
      // Only run on client side
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const token = getAccessToken();
      const storedUser = getUser();

      // No token → not logged in, skip
      if (!token || !storedUser) {
        setIsLoading(false);
        return;
      }

      // Optimistically show stored user immediately while we validate
      setUserState(storedUser);
      setIsAuthenticated(true);

      try {
        // Validate token by fetching fresh profile from backend
        const freshUser = await fetchProfileAPI();
        if (freshUser) {
          setUser(freshUser);
          setUserState(freshUser);
        }
      } catch (e) {
        // Token is expired or invalid — silently clear session
        clearAuthTokens();
        clearUser();
        setUserState(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const response = await login({
      login_type: "direct",
      email,
      password,
    });

    setAuthTokens(response.access, response.refresh);
    setUser(response.user);
    setUserState(response.user);
    setIsAuthenticated(true);

    toast.success("Welcome back!", {
      description: `Signed in as ${response.user.full_name}`,
    });

    navigate({ to: "/profile" });
  };

  const handleLoginWithGoogle = async (email: string, fullName: string) => {
    const response = await login({
      login_type: "google",
      email,
    });

    setAuthTokens(response.access, response.refresh);
    setUser(response.user);
    setUserState(response.user);
    setIsAuthenticated(true);

    toast.success("Welcome back!", {
      description: `Signed in as ${response.user.full_name}`,
    });

    navigate({ to: "/profile" });
  };

  const handleSignup = async (
    fullName: string,
    email: string,
    password: string,
    passwordConfirm: string,
    phoneNumber: string,
    country: string
  ) => {
    const response = await signup({
      signup_type: "direct",
      full_name: fullName,
      email,
      password,
      password_confirm: passwordConfirm,
      phone_number: phoneNumber,
      country,
    });

    setAuthTokens(response.access, response.refresh);
    setUser(response.user);
    setUserState(response.user);
    setIsAuthenticated(true);

    toast.success("Account created!", {
      description: `Welcome, ${response.user.full_name}`,
    });

    navigate({ to: "/profile" });
  };

  const handleSignupWithGoogle = async (fullName: string, email: string) => {
    const response = await signup({
      signup_type: "google",
      full_name: fullName,
      email,
    });

    setAuthTokens(response.access, response.refresh);
    setUser(response.user);
    setUserState(response.user);
    setIsAuthenticated(true);

    toast.success("Account created!", {
      description: `Welcome, ${response.user.full_name}`,
    });

    navigate({ to: "/profile" });
  };

  const handleUpdateProfile = async (data: Partial<User>): Promise<User> => {
    const updatedUser = await updateProfileAPI(data);
    setUser(updatedUser);
    setUserState(updatedUser);
    return updatedUser;
  };

  const handleLogout = async () => {
    await logoutAPI();
    clearAuthTokens();
    clearUser();
    setUserState(null);
    setIsAuthenticated(false);

    toast.success("Signed out", {
      description: "You have been signed out successfully",
    });

    navigate({ to: "/login" });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        loginWithGoogle: handleLoginWithGoogle,
        signup: handleSignup,
        signupWithGoogle: handleSignupWithGoogle,
        updateProfile: handleUpdateProfile,
        logout: handleLogout,
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
