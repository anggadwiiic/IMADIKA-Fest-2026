/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#14B8A6",
        "primary-dark": "#0F766E",
        "primary-pressed": "#115E59",
        "primary-soft": "#CCFBF1",
        "on-primary": "#FFFFFF",
        "on-primary-soft": "#115E59",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        border: "#E5E7EB",
        success: "#16A34A",
        "success-soft": "#DCFCE7",
        "on-success-soft": "#166534",
        warning: "#D97706",
        "warning-soft": "#FEF3C7",
        "on-warning-soft": "#92400E",
        danger: "#DC2626",
        "danger-soft": "#FEE2E2",
        "on-danger-soft": "#991B1B",
        info: "#2563EB",
        "info-soft": "#DBEAFE",
        "on-info-soft": "#1E40AF",
        "neutral-soft": "#F3F4F6",
        "on-neutral-soft": "#374151",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
