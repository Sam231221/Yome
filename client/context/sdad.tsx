"use client";
import { createContext, ReactNode, useContext, useReducer } from "react";
import reducer from "./StateReducers";
import { initialState } from "./StateReducers";

// Provide a default value for the context
export const StateContext = createContext([initialState, () => {}]); // Or a more appropriate default

export const StateProvider = ({ children }: { children: ReactNode }) => (
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
);

export const useStateProvider = () => useContext(StateContext);
