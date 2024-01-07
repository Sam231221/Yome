import React, { useEffect, useRef } from "react";
import { BsBoxArrowRight } from "react-icons/bs";
import { IoCloseOutline } from "react-icons/io5";
export default function ContextMenu({
  options,
  cordinates,
  contextMenu,
  setContextMenu,
}) {
  const contextMenuRef = useRef(null);

  const iconComponents = {
    IoCloseOutline: <IoCloseOutline size={25} />,
    BsBoxArrowRight: <BsBoxArrowRight size={20} />,
  };
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (event.target.id !== "context-opener") {
        if (
          contextMenuRef.current &&
          !contextMenuRef.current.contains(event.target)
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
    const handleKeyPress = (e) => {
      if (e.key === "Escape") {
        if (contextMenu) setContextMenu(false);
      }
    };
    window.addEventListener("keyup", handleKeyPress);
    return () => window.removeEventListener("keyup", handleKeyPress);
  }, []);
  const handleClick = (e, callBack) => {
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
          const IconComponent = iconComponents[icon];

          return (
            <div className="flex px-2 hover:bg-background-default-hover items-center ">
              {icon !== "" ? IconComponent : ""}
              <li
                className=" px-3 py-2 cursor-pointer"
                onClick={(e) => handleClick(e, callBack)}
              >
                <span className="font-medium text-sm">{name}</span>
              </li>
            </div>
          );
        })}
      </ul>
    </div>
  );
}
