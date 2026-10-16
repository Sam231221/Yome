"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useReducer,
  Dispatch,
} from "react";
import reducer, { State, Action, initialState } from "./StateReducers";

// Provide a default value for the context
const StateContext = createContext<[State, Dispatch<Action>]>([
  initialState,
  () => initialState,
]);

export const StateProvider = ({ children }: { children: ReactNode }) => (
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
);

export const useStateProvider = () => useContext(StateContext);
