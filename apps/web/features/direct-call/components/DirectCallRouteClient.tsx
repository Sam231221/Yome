"use client";

import { useEffect, useState } from "react";
import {
  StreamCall,
  StreamTheme,
  useStreamVideoClient,
  type Call,
} from "@stream-io/video-react-sdk";
import { useStateProvider } from "@/context/StateContext";
import {
  getCallMemberIds,
  parseDirectCallCustomData,
} from "@/features/direct-call/lib/guards";
import type { DirectCallMode } from "@/features/direct-call/types";
import { DirectCallRoom } from "./DirectCallRoom";
import {
  DirectCallErrorState,
  DirectCallLoadingState,
} from "./DirectCallStates";

type DirectCallRouteClientProps = {
  conversationId: string;
  callId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; call: Call; initialMode: DirectCallMode };

function useDirectCallLoadState({
  conversationId,
  callId,
}: DirectCallRouteClientProps): LoadState {
  const [{ userInfo }] = useStateProvider();
  const client = useStreamVideoClient();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!client || !userInfo?.id) {
      setState({ status: "loading" });
      return;
    }

    let mounted = true;
    const call = client.call("default", callId);

    const load = async () => {
      try {
        await call.get();
        if (!mounted) return;

        const custom = parseDirectCallCustomData(call.state.custom);
        if (!custom || custom.conversationId !== conversationId) {
          setState({
            status: "error",
            message: "This call link does not belong to the selected conversation.",
          });
          return;
        }

        const memberIds = getCallMemberIds(call);
        if (!memberIds.includes(String(userInfo.id))) {
          setState({
            status: "error",
            message: "You are not a member of this direct call.",
          });
          return;
        }

        setState({
          status: "ready",
          call,
          initialMode: custom.initialMode,
        });
      } catch {
        if (!mounted) return;
        setState({
          status: "error",
          message: "We couldn't load this call. It may have ended or the link is invalid.",
        });
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [callId, client, conversationId, userInfo?.id]);

  return state;
}

export function DirectCallRouteClient(props: DirectCallRouteClientProps) {
  const state = useDirectCallLoadState(props);

  if (state.status === "loading") {
    return <DirectCallLoadingState label="Loading call..." />;
  }

  if (state.status === "error") {
    return <DirectCallErrorState message={state.message} />;
  }

  return (
    <main className="min-h-screen bg-[#080d1b]">
      <StreamCall call={state.call}>
        <StreamTheme>
          <DirectCallRoom
            conversationId={props.conversationId}
            initialMode={state.initialMode}
          />
        </StreamTheme>
      </StreamCall>
    </main>
  );
}
