"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import PropTypes from "prop-types";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  {
    display: "Home",
    url: "/home",
  },
  {
    display: "Pricing",
    url: "/pricing",
  },
  {
    display: "About",
    url: "#",
  },
  {
    display: "Contact",
    url: "#",
  },
  {
    display: "FAQ",
    url: "#",
  },
];

const ProductDropdown = ({ types, onSelect }) => {
  return (
    <ul className="absolute top-full left-0 bg-#0d0225 border border-gray-300 rounded-md shadow-md p-4 w-48 z-10">
      {types.map((type, index) => (
        <li
          key={index}
          onClick={() => onSelect(type)}
          className="text-lg  text-gray-500 font-bold cursor-pointer hover:text-white"
        >
          {type === "Session Replay" && (
            <span onClick={() => console.log("Session Replay clicked")}>
              {type}
            </span>
          )}
          {type === "Error Monitoring" && (
            <span onClick={() => console.log("Error Monitoring clicked")}>
              {type}
            </span>
          )}
          {type === "Logging" && (
            <span onClick={() => console.log("Logging clicked")}>{type}</span>
          )}
          {type === "Integration" && (
            <span onClick={() => console.log("Integration clicked")}>
              {type}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

ProductDropdown.propTypes = {
  types: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const Header = () => {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const session = useSession();
  const splitLocation = usePathname();
  useEffect(() => {
    const handleMouseEnter = () => {
      setIsProductDropdownOpen(true);
    };

    const handleMouseLeave = () => {
      setIsProductDropdownOpen(false);
    };

    if (dropdownRef.current) {
      dropdownRef.current.addEventListener("mouseenter", handleMouseEnter);
      dropdownRef.current.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (dropdownRef.current) {
        dropdownRef.current.removeEventListener("mouseenter", handleMouseEnter);
        dropdownRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  const handleDiscordSignIn = () => {};

  const handleGitHubSignIn = () => {};

  const handleProductTypeSelect = (type) => {
    setIsProductDropdownOpen(false);

    // Perform specific actions based on the selected product type
    switch (type) {
      case "Session Replay":
        // Execute session replay action
        break;
      case "Error Monitoring":
        // Execute error monitoring action
        break;
      case "Logging":
        // Execute logging action
        break;
      case "Integration":
        // Execute integration action
        break;
      default:
        break;
    }
  };

  return (
    <header className="bg-[#0d0225]">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="logo flex gap-2 ml-3 items-center">
            <div className="w-10 h-10">
              <Image
                className="w-full h-full object-contain"
                src="/logos/LogoWhiteT.png"
                width={100}
                height={100}
              />
            </div>
            <h2 className="flex sm:text-xl lg:text-2xl font-bold items-center gap-1 text-white">
              <i className="ri-pantone-line"></i> EduroClass.
            </h2>
          </Link>

          <div className="nav hidden md:flex ml-6 mt-3">
            <ul className="flex space-x-6">
              {navLinks.map((item, index) => (
                <li key={index} className="nav__item">
                  {item.display === "Product" ? (
                    <div ref={dropdownRef} className="relative">
                      <button
                        className="text-gray-500 hover:text-white transition duration-300 text-lg font-semibold mb-2 no-underline flex items-center"
                        onClick={() =>
                          setIsProductDropdownOpen(!isProductDropdownOpen)
                        }
                      >
                        {item.display}
                        <span className="ml-1">&#9662;</span>
                      </button>
                      {isProductDropdownOpen && (
                        <ProductDropdown
                          types={[
                            "Session Replay",
                            "Error Monitoring",
                            "Logging",
                            "Integration",
                          ]}
                          onSelect={handleProductTypeSelect}
                        />
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.url}
                      className={`${
                        splitLocation === item.url
                          ? "text-white"
                          : "text-gray-500"
                      }  hover:text-white transition duration-300 text-lg font-semibold mb-2 no-underline`}
                    >
                      {item.display}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="ml-32 md:hidden cursor-pointer text-white">
            <RxHamburgerMenu size={25} />
          </div>

          <div className="sign-in-buttons text-lg hidden sm:flex lg:flex  items-center gap-3">
            {session?.status === "authenticated" ? (
              <button
                onClick={() => signOut()}
                className="signin-button text-gray-500 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded transition duration-300 hover:bg-aqua hover:text-white border-1 border-aqua"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="signup-button text-gray-500 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded transition duration-300 hover:bg-aqua hover:text-white border-1 border-aqua"
              >
                Sign in
              </Link>
            )}

            <div className="sign-in-buttons hidden sm:flex lg:flex items-center space-x-0">
              <div className="flex">
                <button
                  className="discord-button text-gray-500 px-2 py-2 rounded-l transition duration-300 hover:bg-aqua hover:text-black border-1 border-aqua"
                  onClick={handleDiscordSignIn}
                >
                  <FaDiscord className="icon " style={{ fontSize: "1.5em" }} />
                </button>

                <button
                  className="github-button text-gray-500 px-2 py-2 rounded-r transition duration-300 hover:bg-aqua hover:text-black border-1 border-aqua"
                  onClick={handleGitHubSignIn}
                >
                  <FaGithub className="icon" style={{ fontSize: "1.5em" }} />
                </button>
              </div>
            </div>
          </div>

          <div className="mobile__menu cursor-pointer md:hidden">
            <span
              onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            >
              <i className="ri-menu-line text-white text-3xl"></i>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
