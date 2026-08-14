// src/contexts/PrivacyContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const PrivacyContext = createContext(null);

// Always starts hidden (blurred) — plain useState with no persistence means
// a refresh or a fresh app open naturally resets it back to hidden.
export const PrivacyProvider = ({ children }) => {
  const [isPrivate, setIsPrivate] = useState(true);

  const toggle = useCallback(() => setIsPrivate((v) => !v), []);
  const reveal = useCallback(() => setIsPrivate(false), []);
  const hide   = useCallback(() => setIsPrivate(true), []);

  return (
    <PrivacyContext.Provider value={{ isPrivate, toggle, reveal, hide }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within a PrivacyProvider");
  return ctx;
};
