"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { Video, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const splitLocation = usePathname();
  const session = useSession();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <motion.header
      className="bg-white shadow-sm relative z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Video className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-900">ConnectNow</span>
        </motion.div>

        <div className="flex items-center md:hidden">
          <motion.button
            className="text-blue-900"
            onClick={toggleMenu}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            {["Features", "Pricing", "Contact"].map((item) => (
              <motion.li
                key={item}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  href={`#${item.toLowerCase()}`}
                  className={`${
                    splitLocation === `/${item}`
                      ? "text-blue-900"
                      : "text-gray-500"
                  } hover:text-blue-600 transition-colors `}
                >
                  {item}
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
        {session?.status === "authenticated" ? (
          <motion.li
            className="hidden md:block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => signOut()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign out
            </button>
          </motion.li>
        ) : (
          <Link
            href="/login"
            className=" bg-blue-600 px-3 py-2 text-md font-medium rounded-sm hover:bg-blue-700 text-white"
          >
            Sign in
          </Link>
        )}
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 bg-white shadow-md md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <nav className="container mx-auto px-4 py-4">
              <ul className="space-y-4">
                {["Features", "Pricing", "Contact"].map((item) => (
                  <motion.li
                    key={item}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={`#${item.toLowerCase()}`}
                      className="block text-blue-900 hover:text-blue-600 transition-colors"
                      onClick={toggleMenu}
                    >
                      {item}
                    </Link>
                  </motion.li>
                ))}
                {session?.status === "authenticated" ? (
                  <motion.li
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => signOut()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Sign out
                    </button>
                  </motion.li>
                ) : (
                  <Link
                    href="/login"
                    className="signup-button text-gray-500 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded transition duration-300 hover:bg-aqua hover:text-white border-1 border-aqua"
                  >
                    Sign in
                  </Link>
                )}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
