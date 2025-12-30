import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Cosmic Jyotish Theme Colors - Based on Margadarshan Design
        cosmic: {
          // Background Base Colors
          bg: {
            dark: '#1a0a2e', // Deep Purple (main background)
            DEFAULT: '#2d1b4e', // Indigo (lighter background)
            base: '#0f051d', // Very dark purple
          },
          // Primary Orange/Amber (Pillars & Accents)
          orange: {
            50: '#fff3e0',
            100: '#ffe0b2',
            200: '#ffcc80',
            300: '#ffb74d',
            400: '#ffa726', // Light orange
            500: '#ff8f00', // Primary orange
            600: '#ff6f00', // Bright orange (borders/lines)
            700: '#f57c00',
            800: '#ef6c00',
            900: '#e65100',
          },
          // Gold/Yellow (Text & Zodiac Wheel)
          gold: {
            50: '#fffde7',
            100: '#fff9c4',
            200: '#fff59d',
            300: '#fff176',
            400: '#ffee58',
            500: '#ffc107', // Gold text
            600: '#ffb300', // Bright gold
            700: '#ffa000',
            800: '#ff8f00',
            900: '#ff6f00',
          },
          // Magenta/Pink (Nebula Effects)
          magenta: {
            50: '#fce4ec',
            100: '#f8bbd0',
            200: '#f48fb1',
            300: '#f06292',
            400: '#ec407a',
            500: '#d81b60', // Primary magenta
            600: '#c2185b', // Deep magenta
            700: '#ad1457',
            800: '#880e4f',
            900: '#560027',
          },
          // Deep Red (Nebula & Accents)
          red: {
            50: '#ffebee',
            100: '#ffcdd2',
            200: '#ef9a9a',
            300: '#e57373',
            400: '#ef5350',
            500: '#c62828', // Deep red
            600: '#b71c1c', // Dark red
            700: '#a31515',
            800: '#8b0000',
            900: '#6d0000',
          },
          // Electric Blue (Starfield)
          blue: {
            50: '#e3f2fd',
            100: '#bbdefb',
            200: '#90caf9',
            300: '#64b5f6',
            400: '#42a5f5',
            500: '#2196f3', // Electric blue
            600: '#1976d2', // Deep blue
            700: '#1565c0',
            800: '#0d47a1',
            900: '#01579b',
          },
          // Cosmic Purple (Atmospheric)
          purple: {
            50: '#f3e5f5',
            100: '#e1bee7',
            200: '#ce93d8',
            300: '#ba68c8',
            400: '#ab47bc',
            500: '#7b1fa2', // Cosmic purple
            600: '#6a1b9a', // Deep purple
            700: '#4a148c',
            800: '#38006b',
            900: '#1a0033',
          },
          // Dark Brown/Maroon (Stage/Platform)
          brown: {
            50: '#efebe9',
            100: '#d7ccc8',
            200: '#bcaaa4',
            300: '#a1887f',
            400: '#8d6e63',
            500: '#4e342e', // Dark brown
            600: '#3e2723', // Maroon
            700: '#321911',
            800: '#260e04',
            900: '#1b0a00',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
