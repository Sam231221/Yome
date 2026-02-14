import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
      },
      screens: {
        xs: "340px",
      },
      backgroundImage: {
        "chat-background": "url('/bgChat.jpg')",
      },
      colors: {
        "teal-light": "#7ae3c3",
        "photopicker-overlay-background": "rgba(30,42,49,0.8)",
        "dropdown-background": "#233138",
        "dropdown-background-hover": "#182229",
        "input-background": " #F3F3F5",
        "primary-strong": "#e9edef",
        "panel-header-background": "#F3F3F5",
        "panel-header-icon": "#3f3f3f",
        "icon-lighter": "#8696a0",
        "icon-skyblue": "#3597DA",
        "search-input-container-background": "#dddddd",
        "conversation-border": "rgba(134,150,160,0.15)",
        "conversation-panel-background": "#EEF2FA",
        "background-default-hover": "#F3F3F5",
        "incoming-background": "#ffffff",
        "outgoing-background": "#3597DA",
        "bubble-meta": "hsla(0,0%,100%,0.6)",
        "icon-ack": "#53bdeb",
        primaryTextColor: "#013685",
        secondaryTextColor: "#4154F1",
        ternaryTextColor: "#899bbd",
        quaternaryTextColor: "#51678f",
        primaryBgColor: "#F0F2F5",
        secondaryBgColor: "#f6f6fe",
        ternaryBgColor: "#F3F3F5",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      gridTemplateColumns: {
        main: "1fr 2.4fr",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
