import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Access config directly
import { api as rawApiUrl } from "../config";

// Normalize api base url to use /api for java backend
export const apiBaseUrl = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

const AuthContext = createContext(null);

// Custom Axios instance with interceptors for JWT injection
export const apiInstance = axios.create({
  baseURL: apiBaseUrl,
});

apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        username,
        password,
      });
      const data = response.data;
      if (data.token) {
        localStorage.setItem("token", data.token);
        const userObj = {
          id: data.id,
          username: data.username,
          email: data.email,
          phone: data.phone,
          role: data.role,
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        setUser(userObj);
        return { success: true };
      }
      return { success: false, error: "Authentication failed" };
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Login failed";
      return { success: false, error: errMsg };
    }
  };

  const register = async (username, email, phone, password, role) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/register`, {
        username,
        email,
        phone,
        password,
        role: role || "USER",
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Registration failed";
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
