import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);

  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client) {
      setCall(undefined);
      setIsCallLoading(false);
      return;
    }
    if (!id || (Array.isArray(id) && id.length === 0)) {
      setCall(undefined);
      setIsCallLoading(false);
      return;
    }

    const loadCall = async () => {
      setIsCallLoading(true);
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
