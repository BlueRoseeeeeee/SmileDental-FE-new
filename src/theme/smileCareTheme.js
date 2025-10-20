/**
 * SmileCare Dental System - Design System
 * Theme configuration for consistent UI/UX across all pages
 * 
 * Brand: SmileCare - Professional, Clean, Friendly Dental Care
 * Style: Modern, Medical, Trustworthy
 * Primary Color: Blue (Trust, Medical, Professional)
 */

export const smileCareTheme = {
  // 🎨 COLOR PALETTE
  colors: {
    // Primary - Blue (Trust, Medical)
    primary: {
      50: '#eff6ff',   // Very light blue
      100: '#dbeafe',  // Light blue
      200: '#bfdbfe',  // Soft blue
      300: '#93c5fd',  // Medium light blue
      400: '#60a5fa',  // Medium blue
      500: '#3b82f6',  // PRIMARY BLUE - Main brand color
      600: '#2563eb',  // Dark blue
      700: '#1d4ed8',  // Darker blue
      800: '#1e40af',  // Very dark blue
      900: '#1e3a8a',  // Deepest blue
    },

    // Secondary - Teal (Fresh, Clean, Dental)
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',  // SECONDARY TEAL
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },

    // Accent - Green (Success, Health)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // SUCCESS GREEN
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },

    // Warning - Amber
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // WARNING AMBER
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Error - Red
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // ERROR RED
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },

    // Neutral - Gray (Base, Text, Borders)
    neutral: {
      50: '#f9fafb',   // Almost white
      100: '#f3f4f6',  // Very light gray
      200: '#e5e7eb',  // Light gray
      300: '#d1d5db',  // Medium light gray
      400: '#9ca3af',  // Medium gray
      500: '#6b7280',  // Gray
      600: '#4b5563',  // Dark gray
      700: '#374151',  // Darker gray
      800: '#1f2937',  // Very dark gray
      900: '#111827',  // Almost black
    },

    // Special - White & Black
    white: '#ffffff',
    black: '#000000',

    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Text colors
    text: {
      primary: '#111827',    // Dark gray
      secondary: '#6b7280',  // Medium gray
      tertiary: '#9ca3af',   // Light gray
      inverse: '#ffffff',    // White
      link: '#3b82f6',       // Primary blue
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
    },

    // Border colors
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
      primary: '#3b82f6',
    },
  },

  // 📐 SPACING (Tailwind standard)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // 🔤 TYPOGRAPHY
  typography: {
    fontFamily: {
      sans: ['Inter', 'Roboto', 'Open Sans', 'sans-serif'],
      mono: ['Fira Code', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // 🎭 SHADOWS
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // 📦 BORDER RADIUS
  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',    // Circle
  },

  // ⏱️ TRANSITIONS
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // 📱 BREAKPOINTS (Responsive)
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // 🎨 GRADIENTS
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    secondary: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    hero: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    card: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
  },

  // 🔘 COMPONENT STYLES
  components: {
    button: {
      primary: {
        bg: '#3b82f6',
        hover: '#2563eb',
        active: '#1d4ed8',
        text: '#ffffff',
        shadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
      },
      secondary: {
        bg: '#f3f4f6',
        hover: '#e5e7eb',
        active: '#d1d5db',
        text: '#374151',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      success: {
        bg: '#22c55e',
        hover: '#16a34a',
        active: '#15803d',
        text: '#ffffff',
        shadow: '0 4px 6px -1px rgba(34, 197, 94, 0.3)',
      },
      danger: {
        bg: '#ef4444',
        hover: '#dc2626',
        active: '#b91c1c',
        text: '#ffffff',
        shadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
      },
      outline: {
        border: '#3b82f6',
        text: '#3b82f6',
        hover: '#eff6ff',
      },
    },

    card: {
      bg: '#ffffff',
      border: '#e5e7eb',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      hoverShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      radius: '0.75rem', // 12px
    },

    input: {
      bg: '#ffffff',
      border: '#d1d5db',
      focusBorder: '#3b82f6',
      text: '#111827',
      placeholder: '#9ca3af',
      disabled: '#f3f4f6',
    },

    modal: {
      bg: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
      backdropBlur: 'blur(4px)',
      shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      radius: '1rem', // 16px
    },

    table: {
      headerBg: '#f9fafb',
      rowEven: '#ffffff',
      rowOdd: '#f9fafb',
      rowHover: '#eff6ff',
      border: '#e5e7eb',
    },

    badge: {
      primary: { bg: '#dbeafe', text: '#1e40af' },
      success: { bg: '#dcfce7', text: '#166534' },
      warning: { bg: '#fef3c7', text: '#92400e' },
      error: { bg: '#fee2e2', text: '#991b1b' },
      gray: { bg: '#f3f4f6', text: '#374151' },
    },
  },

  // 🎯 Z-INDEX LAYERS
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // 📏 LAYOUT
  layout: {
    containerMaxWidth: '1280px',
    sidebarWidth: '256px',
    headerHeight: '64px',
    footerHeight: '80px',
  },
};

// 🎨 UTILITY FUNCTIONS
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getButtonStyles = (variant = 'primary', size = 'md') => {
  const styles = smileCareTheme.components.button[variant] || smileCareTheme.components.button.primary;
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  return {
    backgroundColor: styles.bg,
    color: styles.text,
    boxShadow: styles.shadow,
    className: `${sizes[size]} rounded-lg font-medium transition-all duration-300 hover:shadow-lg active:scale-95`,
  };
};

export const getCardStyles = () => ({
  backgroundColor: smileCareTheme.components.card.bg,
  borderRadius: smileCareTheme.components.card.radius,
  boxShadow: smileCareTheme.components.card.shadow,
  border: `1px solid ${smileCareTheme.components.card.border}`,
});

export default smileCareTheme;
