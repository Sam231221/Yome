import { Inter } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/context/StateContext";
import { ReactNode } from "react";
import AuthProvider from "@/context/AuthProvider";
import ModalContextProvider from "@/context/ModalContextProvider";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "Yome",
  description:
    "Experience seamless communication with our cutting-edge video calling and chat platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={inter.className}>
        <AuthProvider>
          <ModalContextProvider>
            <StateProvider>
              <Toaster />
              <div id="photo-picker-element"></div>
              <>{children}</>
            </StateProvider>
          </ModalContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
