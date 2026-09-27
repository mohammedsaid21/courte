/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          DEFAULT: "#16C75A",
          deep: "#087A3E",
          stadium: "#07130D",
          surface: "#0D1C13",
          pitch: "#123D25",
          lime: "#B8FF3B",
          warm: "#F5F7F2",
        },
        warm: "#F5F7F2",
        line: "#E1E8E2",
        copy: {
          primary: "#101812",
          secondary: "#68736B",
        },
        night: {
          DEFAULT: "#0A3D26",
          800: "#0E4A2E",
          700: "#146038",
        },
        lime: {
          DEFAULT: "#C9A227",
          dim: "#B08E1F",
        },
        pitch: {
          DEFAULT: "#0E5C38",
          dark: "#0A3D26",
          deep: "#072B1B",
          mist: "#D7E4DA",
          light: "#ECF4EE",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#F4E7B8",
        },
        sport: {
          DEFAULT: "#0E5C38",
          soft: "#ECF4EE",
        },
        brand: {
          500: "#0E5C38",
          600: "#0E5C38",
          700: "#0A3D26",
        },
        bg: {
          DEFAULT: "#EEF2EF",
          elevated: "#FFFFFF",
          subtle: "#E3EBE5",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F7F5",
        },
        border: {
          DEFAULT: "#D5DFD8",
          strong: "#B9C8BE",
        },
        text: {
          DEFAULT: "#12241C",
          muted: "#5B6B62",
        },
        success: {
          DEFAULT: "#0E5C38",
          soft: "#ECF4EE",
        },
        warning: {
          DEFAULT: "#B46A06",
          soft: "#FFF7E8",
        },
        danger: {
          DEFAULT: "#C73434",
          soft: "#FFF0F0",
        },
        ink: {
          50: "#EEF2EF",
          100: "#D5DFD8",
          700: "#5B6B62",
          800: "#0E4A2E",
          900: "#072B1B",
        },
        field: {
          50: "#ECF4EE",
          100: "#D7E4DA",
          500: "#0E5C38",
          600: "#0E5C38",
          700: "#0A3D26",
        },
        clay: {
          500: "#C46B3A",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "var(--font-display)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "12px",
      },
      boxShadow: {
        sheet: "0 24px 60px rgba(10, 61, 38, 0.22)",
        glass: "0 14px 40px rgba(18, 36, 28, 0.10)",
      },
      keyframes: {
        "hero-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "hero-float": "hero-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
