"use client";

import { useEffect, useState } from "react";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";

const NO_CALLS: Call[] = [];

/**
 * Like the SDK's `useCalls()`, but safe to use before a client exists. The SDK hook throws
 * when rendered outside `<StreamVideo>`, which is the case while the user/client is loading
 * or when Stream isn't configured.
 */
export function useClientCalls(client?: StreamVideoClient): Call[] {
  const [calls, setCalls] = useState<Call[]>(NO_CALLS);

  useEffect(() => {
    if (!client) {
      setCalls(NO_CALLS);
      return;
    }
    const subscription = client.state.calls$.subscribe(setCalls);
    return () => subscription.unsubscribe();
  }, [client]);

  return calls;
}
