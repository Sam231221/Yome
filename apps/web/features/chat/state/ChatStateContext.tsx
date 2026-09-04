"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useReducer,
  Dispatch,
} from "react";
import chatReducer, { ChatState, ChatAction, initialChatState } from "./chat-reducer";

const ChatStateContext = createContext<[ChatState, Dispatch<ChatAction>] | null>(
  null
);

export const ChatStateProvider = ({ children }: { children: ReactNode }) => {
  const state = useReducer(chatReducer, initialChatState);

  return (
    <ChatStateContext.Provider value={state}>{children}</ChatStateContext.Provider>
  );
};

export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatStateProvider");
  }
  return context;
};
