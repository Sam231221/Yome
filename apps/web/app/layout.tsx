import "./globals.css";
import "./app-theme.css";
import "./chat.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { StateProvider } from "@/context/StateContext";
import { ReactNode } from "react";
import AuthProvider from "@/context/AuthProvider";
import ModalContextProvider from "@/context/ModalContextProvider";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Yome",
  description:
    "Yome is a learning-first social network for students, educators, and STEM communities.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
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
