const SOUND_SRC = "/sounds/Messenger-Notification-Sound.mp3";

let notificationAudio: HTMLAudioElement | null = null;

const getAudio = () => {
  if (!notificationAudio) {
    notificationAudio = new Audio(SOUND_SRC);
  }
  return notificationAudio;
};

export const playNotificationSound = () => {
  if (typeof window === "undefined") return;
  try {
    const audio = getAudio();
    audio.currentTime = 0;
    const playResult = audio.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  } catch {
    // ignore autoplay errors
  }
};
