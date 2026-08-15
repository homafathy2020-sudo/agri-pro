// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred;
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
