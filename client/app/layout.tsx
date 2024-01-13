import { Inter } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/context/StateContext";
import { ReactNode } from "react";
import AuthProvider from "@/context/AuthProvider";
import ModalContextProvider from "@/context/ModalContextProvider";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "EduroClass",
  description: "An Web based Saas Platform to centrailize Education system",
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
              <div>{children}</div>
            </StateProvider>
          </ModalContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
