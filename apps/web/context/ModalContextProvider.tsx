"use client";
import React, { useState, createContext, useContext } from "react";

type ModalContextValue = { isModalOpen: boolean; setModalOpen: React.Dispatch<React.SetStateAction<boolean>> };
export const ModalContext = createContext<ModalContextValue | null>(null);
export default function ModalContextProvider({ children }: { children: React.ReactNode }) {
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
