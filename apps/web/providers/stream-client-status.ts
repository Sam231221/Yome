"use client";

import { createContext, useContext } from "react";
import type { StreamVideoClient } from "@stream-io/video-react-sdk";

export type StreamClientStatus = {
  client?: StreamVideoClient;
  isReady: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  setupError?: string;
};

export const StreamClientStatusContext = createContext<StreamClientStatus>({
  client: undefined,
  isReady: false,
  isConfigured: false,
  isLoading: true,
  setupError: undefined,
});

export const useStreamClientStatus = () =>
  useContext(StreamClientStatusContext);
