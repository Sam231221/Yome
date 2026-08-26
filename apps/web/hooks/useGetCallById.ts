import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);

  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client) return;

    const loadCall = async () => {
      try {
        const nextCall = client.call("default", String(id));
        await nextCall.getOrCreate();
        setCall(nextCall);

        setIsCallLoading(false);
      } catch {
        setIsCallLoading(false);
      }
    };

    loadCall();
  }, [client, id]);
  //then return this call
  return { call, isCallLoading };
};
