export function absoluteUrl(path) {
  return `${
    process.env.FRONTEND_CLIENT_PORT || "http://localhost:3000/"
  }${path}`;
}

export function backendAbsoluteUrl(path) {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3005"
  }/${path}`;
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
