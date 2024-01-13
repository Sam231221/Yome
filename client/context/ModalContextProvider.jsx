"use client";
import React, { useState, createContext, useContext } from "react";

export const ModalContext = createContext(null);
export default function ModalContextProvider({ children }) {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <ModalContext.Provider value={{ isModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
}
export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalContext must be defined within the provider.");
  }
  return context;
}
