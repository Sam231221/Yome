"use client";
import Navbar from "@/components/common/Navbar";

export default function HomeLayout({ children }) {
  return (
    <div className="relative">
      <Navbar />
      {children}
    </div>
  );
}
