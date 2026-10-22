export function backendAbsoluteUrl(path: string) {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4100"
  }/${path}`;
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
