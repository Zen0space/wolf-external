export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: {
    main: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  border: string;
  shadow: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  light: {
    primary: '#2A3B4C',
    secondary: '#4A5568',
    accent: '#4A90E2',
    background: {
      main: '#FFFFFF',
      paper: '#F8FAFC',
    },
    text: {
      primary: '#2A3B4C',
      secondary: '#4A5568',
      accent: '#4A90E2',
    },
    border: 'rgba(0, 0, 0, 0.1)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    primary: '#FFFFFF',
    secondary: '#E2E8F0',
    accent: '#60A5FA',
    background: {
      main: '#1A1F2B',
      paper: '#242A38',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      accent: '#60A5FA',
    },
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
}; 