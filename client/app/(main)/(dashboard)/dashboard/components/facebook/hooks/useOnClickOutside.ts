import { RefObject, useEffect } from "react";

export default function useOnClickOutside(
  refs: Array<RefObject<HTMLElement>>,
  handler: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) {
        return;
      }
      handler();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handler();
      }
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
      document.removeEventListener("keydown", handleKey);
    };
  }, [refs, handler, active]);
}
