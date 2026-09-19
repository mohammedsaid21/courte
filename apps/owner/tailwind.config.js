/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: "#0F172A",
          800: "#1E293B",
          700: "#334155",
        },
        brand: {
          DEFAULT: "#3DDB7A",
          hover: "#2BB673",
          light: "#ECFDF5",
          bright: "#86EFAC",
          500: "#3DDB7A",
          600: "#2BB673",
          700: "#239A61",
        },
        lime: {
          DEFAULT: "#86EFAC",
          dim: "#4ADE80",
        },
        sport: {
          DEFAULT: "#3DDB7A",
          soft: "#ECFDF5",
        },
        bg: {
          DEFAULT: "#F1F5F9",
          elevated: "#FFFFFF",
          subtle: "#F8FAFC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        text: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        success: {
          DEFAULT: "#2BB673",
          soft: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#D97706",
          soft: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEF2F2",
        },
        ink: {
          50: "#F8FAFC",
          100: "#E2E8F0",
          700: "#64748B",
          800: "#1E293B",
          900: "#0F172A",
        },
        field: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#3DDB7A",
          600: "#2BB673",
          700: "#239A61",
        },
        clay: {
          500: "#C46B3A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-display)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "16px",
      },
      boxShadow: {
        sheet: "0 24px 60px rgba(15, 23, 42, 0.28)",
        brand: "0 4px 20px -2px rgba(61, 219, 122, 0.4)",
      },
    },
  },
  plugins: [],
};
