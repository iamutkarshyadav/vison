import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  credits: number;
  plan: "free" | "pro" | "premium";
  joinedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateCredits: (amount: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem("visionai_user");
      const token = localStorage.getItem("visionai_token");

      if (savedUser && token) {
        try {
          // Validate saved user data structure
          const parsedUser = JSON.parse(savedUser);
          if (!parsedUser.id || !parsedUser.email || !parsedUser.name) {
            console.warn("Invalid user data structure, clearing auth");
            logout();
            return;
          }

          // Validate token with server
          const response = await fetch("/api/auth/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setUser(data.data.user);
              localStorage.setItem(
                "visionai_user",
                JSON.stringify(data.data.user),
              );
            } else {
              logout();
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error("Error validating session:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // Try regular login first
      let response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // If database is unavailable, try demo login
      if (response.status === 503) {
        response = await fetch("/api/auth/login-demo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        // Better error messages based on status
        if (response.status === 401) {
          throw new Error(
            "Invalid email or password. Please check your credentials.",
          );
        } else if (response.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a moment.");
        } else {
          throw new Error(data.message || "Login failed");
        }
      }

      if (data.success && data.data) {
        const { user, token } = data.data;
        setUser(user);
        localStorage.setItem("visionai_user", JSON.stringify(user));
        localStorage.setItem("visionai_token", token);

        if (data.demo) {
          localStorage.setItem("visionai_demo_mode", "true");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);

    try {
      // Try regular registration first
      let response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      // If database is unavailable, try demo registration
      if (response.status === 503) {
        response = await fetch("/api/auth/register-demo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (data.success && data.data) {
        const { user, token } = data.data;
        setUser(user);
        localStorage.setItem("visionai_user", JSON.stringify(user));
        localStorage.setItem("visionai_token", token);

        if (data.demo) {
          localStorage.setItem("visionai_demo_mode", "true");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("visionai_user");
    localStorage.removeItem("visionai_token");
    localStorage.removeItem("visionai_demo_mode");
  };

  const updateCredits = (amount: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        credits: Math.max(0, user.credits + amount),
      };
      setUser(updatedUser);
      localStorage.setItem("visionai_user", JSON.stringify(updatedUser));
    }
  };

  // Auto-refresh user data from server
  const refreshUser = async () => {
    const token = localStorage.getItem("visionai_token");
    if (!token) return;

    try {
      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data.user);
          localStorage.setItem("visionai_user", JSON.stringify(data.data.user));
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateCredits,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
