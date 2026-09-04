import React, { useEffect, useRef } from "react";
import { BsBoxArrowRight } from "react-icons/bs";
import { IoCloseOutline } from "react-icons/io5";

type ContextMenuOption = { name: string; icon?: string; callBack: () => void };
type ContextMenuProps = {
  options: ContextMenuOption[];
  cordinates: { x: number; y: number };
  contextMenu: boolean;
  setContextMenu: (v: boolean) => void;
};

export default function ContextMenu({
  options,
  cordinates,
  contextMenu,
  setContextMenu,
}: ContextMenuProps) {
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const iconComponents = {
    IoCloseOutline: <IoCloseOutline size={25} />,
    BsBoxArrowRight: <BsBoxArrowRight size={20} />,
  };
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && (target as HTMLElement).id !== "context-opener") {
        if (
          contextMenuRef.current &&
          target &&
          !contextMenuRef.current.contains(target)
        ) {
          setContextMenu(false); // Close the context menu
        }
      }
    };

    document.addEventListener("click", handleOutsideClick); // Add the event listener

    return () => {
      document.removeEventListener("click", handleOutsideClick); // Clean up the event listener on component unmount
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (contextMenu) setContextMenu(false);
      }
    };
    window.addEventListener("keyup", handleKeyPress);
    return () => window.removeEventListener("keyup", handleKeyPress);
  }, []);
  const handleClick = (e: React.MouseEvent, callBack: () => void) => {
    e.stopPropagation();
    callBack();
  };
  return (
    <div
      className={`bg-white drop-shadow-lg absolute py-2 z-[100]`}
      ref={contextMenuRef}
      style={{
        boxShadow:
          "0 2px 5px 0 rgba(var(11,20,26),.26),0 2px 10px 0 rgba(11,20,26;),.16)",
        top: cordinates.x,
        right: cordinates.y,
      }}
    >
      <ul>
        {options.map(({ name, icon, callBack }) => {
          const IconComponent = icon != null ? iconComponents[icon as keyof typeof iconComponents] : undefined;

          return (
            <li
              key={`${name}-${icon ?? "no-icon"}`}
              className="flex px-2 hover:bg-background-default-hover items-center cursor-pointer"
              onClick={(e) => handleClick(e, callBack)}
            >
              {icon ? IconComponent : ""}
              <span
                className="px-3 py-2 font-medium text-sm"
                onClick={(e) => handleClick(e, callBack)}
              >
                {name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
