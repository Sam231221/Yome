import "./globals.css";
import "./app-theme.css";
import "@/features/chat/styles/chat.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { ReactNode } from "react";
import AuthProvider from "@/features/auth/providers/AuthProvider";
import { AuthStateProvider } from "@/features/auth/providers/AuthStateProvider";
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
          <AuthStateProvider>
            <Toaster />
            <div id="photo-picker-element"></div>
            <>{children}</>
          </AuthStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
