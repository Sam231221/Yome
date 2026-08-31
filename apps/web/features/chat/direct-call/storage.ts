const getAutoJoinKey = (callId: string) => `yome:direct-call:auto-join:${callId}`;

export const markDirectCallAutoJoinIntent = (callId: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(getAutoJoinKey(callId), "1");
};

export const consumeDirectCallAutoJoinIntent = (callId: string) => {
  if (typeof window === "undefined") return false;
  const key = getAutoJoinKey(callId);
  const shouldJoin = window.sessionStorage.getItem(key) === "1";
  if (shouldJoin) {
    window.sessionStorage.removeItem(key);
  }
  return shouldJoin;
};
