import { Inter } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/context/StateContext";
import { ReactNode } from "react";
import AuthProvider from "@/context/AuthProvider";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "EduroClass",
  description: "An Web based Saas Platform to centrailize Education system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <StateProvider>
            <Toaster />
            <div id="photo-picker-element"></div>
            <div>{children}</div>
          </StateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
