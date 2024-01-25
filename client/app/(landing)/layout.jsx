"use client";
import Header from "./components/Header/Header";
import { usePathname } from "next/navigation";

export default function HomeLayout({ children }) {
  return (
    <div className="relative">
      <Header />
      {children}
    </div>
  );
}
