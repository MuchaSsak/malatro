import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/** Tokens are RGB channels on :root (src/styles.css) so opacity modifiers work. */
const channel = (name: string) => `rgb(var(--m-${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        red: channel("red"),
        blue: channel("blue"),
        green: channel("green"),
        orange: channel("orange"),
        important: channel("important"),
        money: channel("money"),
        gold: channel("gold"),
        purple: channel("purple"),
        panel: channel("panel"),
        "panel-light": channel("panel-light"),
        grey: channel("grey"),
        inset: channel("inset"),
        "inset-deep": channel("inset-deep"),
        inactive: channel("inactive"),
        outline: channel("outline"),
        tarot: channel("tarot"),
        planet: channel("planet"),
        voucher: channel("voucher"),
        booster: channel("booster"),
        ink: channel("ink"),
        paper: channel("paper"),
      },
      fontFamily: {
        pixel: ["m6x11plus", "Pixelify Sans", "monospace"],
      },
      borderRadius: {
        panel: "12px",
      },
      // pixel cursors, switchable at runtime (src/styles.css)
      cursor: {
        default: "var(--cur-default)",
        pointer: "var(--cur-pointer)",
        grab: "var(--cur-grab)",
        grabbing: "var(--cur-grab)",
        crosshair: "var(--cur-draw)",
      },
      boxShadow: {
        hard: "0 5px 0 0 rgba(0,0,0,0.35)",
        "hard-sm": "0 3px 0 0 rgba(0,0,0,0.35)",
        card: "0 8px 0 0 rgba(0,0,0,0.3)",
      },
      keyframes: {
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0.35" } },
        spinSlow: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        bob: "bob 3s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        blink: "blink 1s steps(1) infinite",
        "spin-slow": "spinSlow 12s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
