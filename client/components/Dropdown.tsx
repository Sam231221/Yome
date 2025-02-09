"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export interface DropdownItem {
  label: string;
  onClick: () => void;
}

interface CustomDropdownProps {
  items: DropdownItem[];
  label: string;
  onClick?: (isOpen: boolean) => void;
}

export const Dropdown: React.FC<CustomDropdownProps> = ({
  items,
  label,
  onClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the button

  const checkPosition = () => {
    if (dropdownRef.current && menuRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;
      const windowHeight = window.innerHeight;

      setOpenUpwards(dropdownRect.bottom + menuHeight > windowHeight);
    }
  };

  useEffect(() => {
    checkPosition();
    window.addEventListener("resize", checkPosition);
    return () => window.removeEventListener("resize", checkPosition);
  }, []);

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onClick?.(newIsOpen);

    if (newIsOpen) {
      // Focus on the first item when the dropdown opens
      setTimeout(() => {
        // Use setTimeout to ensure the menu is rendered
        if (menuRef.current?.children[0]?.firstChild instanceof HTMLElement) {
          menuRef.current?.children[0]?.firstChild?.focus();
        }
      }, 0);
    } else {
      // Return focus to the button when the dropdown closes
      if (buttonRef.current) {
        buttonRef.current.focus();
      }
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    setIsOpen(false);
    onClick?.(false);
    if (buttonRef.current) {
      buttonRef.current.focus(); // Return focus to the button
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef} // Assign the ref to the button
        type="button"
        onClick={toggleDropdown}
        className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        id="dropdown-button" // Add an ID for ARIA linking
        onKeyDown={(e) => {
          // Handle keyboard navigation
          if (e.key === "ArrowDown" && !isOpen) {
            e.preventDefault();
            toggleDropdown();
          } else if (e.key === "Escape" && isOpen) {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        {label}
        <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: openUpwards ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpwards ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              "absolute right-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10", // Added z-index
              openUpwards ? "bottom-full mb-2" : "top-full mt-2"
            )}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="dropdown-button"
          >
            <div className="py-1">
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  {index === Math.floor(items.length / 2) && (
                    <div className="h-px bg-gray-200 my-1" />
                  )}
                  <button // Use button for menu items
                    onClick={() => handleItemClick(item)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left focus:outline-none"
                    role="menuitem"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        // Handle Enter and Space
                        e.preventDefault();
                        handleItemClick(item);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        // Focus on the next item (implementation needed)
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        // Focus on the previous item (implementation needed)
                      }
                    }}
                  >
                    {item.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
