import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
      },
      screens: {
        xs: "340px",
        chatMobile: { max: "699px" },
        chatCompact: { max: "1100px" },
      },
      backgroundImage: {
        "chat-background": "url('/bgChat.jpg')",
      },
      colors: {
        yome: {
          bg: "var(--yome-bg)",
          surface: "var(--yome-surface)",
          "surface-2": "var(--yome-surface-2)",
          elevated: "var(--yome-elevated)",
          text: "var(--yome-text)",
          muted: "var(--yome-muted)",
          border: "var(--yome-border)",
          navy: "var(--yome-navy)",
          blue: "var(--yome-blue)",
          teal: "var(--yome-teal)",
          amber: "var(--yome-amber)",
          violet: "var(--yome-violet)",
        },
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
        yome: "8px",
        "yome-sm": "6px",
        "yome-lg": "12px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        yome: "var(--yome-shadow)",
        "yome-panel": "0 14px 40px rgba(15, 23, 42, 0.08)",
      },
      spacing: {
        "yome-sidebar": "248px",
        "yome-topbar": "72px",
        "yome-mobile-nav": "66px",
      },
      gridTemplateColumns: {
        main: "1fr 2.4fr",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
