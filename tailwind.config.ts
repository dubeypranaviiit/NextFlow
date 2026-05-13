import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        galaxy: {
          red: "#ef1b22",
          purple: "#6250f4",
          ink: "#101014",
          muted: "#6b7280",
          line: "#e5e7eb",
          canvas: "#fbfbfc"
        }
      },
      boxShadow: {
        node: "0 12px 28px rgba(16, 16, 20, 0.12)",
        card: "0 1px 2px rgba(16, 16, 20, 0.05)",
        float: "0 10px 30px rgba(16, 16, 20, 0.14)"
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(98, 80, 244, 0.30), 0 12px 28px rgba(16, 16, 20, 0.12)" },
          "50%": { boxShadow: "0 0 0 10px rgba(98, 80, 244, 0.06), 0 16px 36px rgba(98, 80, 244, 0.20)" }
        },
        edgeDash: {
          from: { strokeDashoffset: "24" },
          to: { strokeDashoffset: "0" }
        },
        panelIn: {
          from: { transform: "translateX(16px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" }
        }
      },
      animation: {
        pulseGlow: "pulseGlow 1.7s ease-in-out infinite",
        panelIn: "panelIn 180ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
