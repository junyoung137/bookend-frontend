// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🌿 자연 색상 팔레트 (기존 유지)
        dawn: "#E8F4F8",
        morning: "#F5F9F0",
        noon: "#FEFDFB",
        afternoon: "#FFF8F0",
        evening: "#F0F4F8",
        night: "#1A1F2E",

        earth: "#8B7355",
        moss: "#7A9B76",
        stone: "#9CA3AF",
        water: "#7DD3C0",
        sky: "#A5C9E6",

        bloom: "#E8AEB7",
        seed: "#F4D03F",
        leaf: "#9DC88D",

        // 🎄 캐롤 테마 전용 색상 (NEW)
        carol: {
          red: {
            DEFAULT: "#8B4049",    // 딥 와인 레드
            light: "#A65D66",      // 라이트 와인
            dark: "#6B2737",       // 버건디
          },
          green: {
            DEFAULT: "#2D5F4C",    // 에메랄드 그린
            light: "#3A7A63",      // 라이트 에메랄드
            dark: "#1A4D2E",       // 포레스트 그린
          },
          gold: {
            DEFAULT: "#D4AF37",    // 앤티크 골드
            light: "#E8C95C",      // 라이트 골드
            dark: "#B8941F",       // 다크 골드
          },
          cream: "#FFF8E7",        // 따뜻한 크림
          ivory: "#FFFFF0",        // 아이보리
          copper: "#B87333",       // 코퍼
          pine: "#2C5530",         // 파인 그린
        },

        // 🧩 Shadcn 기본 변수 (기존 유지)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "gentle-pulse": "gentlePulse 3s ease-in-out infinite",
        // 🆕 테마 전환 애니메이션
        "theme-fade": "themeFade 0.3s ease-in-out",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gentlePulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.02)", opacity: "0.9" },
        },
        // 🆕 테마 전환용
        themeFade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.03" },
          "50%": { opacity: "0.06" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 🆕 배경 그라데이션 유틸리티
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // 기본 테마 그라데이션
        "default-base": "linear-gradient(135deg, #FAF8F3 0%, #F5F1E8 50%, #F0EBE0 100%)",
        // 캐롤 테마 그라데이션
        "carol-base": "linear-gradient(135deg, #FFF8E7 0%, #FFF4E0 50%, #FFF0D8 100%)",
      },
      // 🆕 커스텀 스페이싱 (필요시)
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      // 🆕 블러 효과
      blur: {
        xs: '2px',
        '4xl': '80px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;