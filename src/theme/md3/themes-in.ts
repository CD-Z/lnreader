import { createThemes } from '@tamagui/theme-builder';

export const themes = createThemes({
  base: {
    palette: {
      // Simple gradient palettes as shown in documentation
      light: [
        'rgb(255, 251, 255)', // background (light)
        'rgb(250, 245, 250)', // slightly darker
        'rgb(245, 240, 245)', // darker
        'rgb(240, 235, 240)', // even darker
        'rgb(235, 230, 235)', // darker still
        'rgb(230, 225, 230)', // much darker
        'rgb(225, 220, 225)', // very dark
        'rgb(220, 215, 220)', // very dark
        'rgb(215, 210, 215)', // very dark
        'rgb(210, 205, 210)', // very dark
        'rgb(205, 200, 205)', // very dark
        'rgb(28, 27, 31)', // foreground (dark text)
      ],
      dark: [
        'rgb(22, 21, 29)', // background (dark)
        'rgb(27, 26, 34)', // slightly lighter
        'rgb(32, 31, 39)', // lighter
        'rgb(37, 36, 44)', // even lighter
        'rgb(42, 41, 49)', // lighter still
        'rgb(47, 46, 54)', // much lighter
        'rgb(52, 51, 59)', // very light
        'rgb(57, 56, 64)', // very light
        'rgb(62, 61, 69)', // very light
        'rgb(67, 66, 74)', // very light
        'rgb(72, 71, 79)', // very light
        'rgb(229, 225, 229)', // foreground (light text)
      ],
    },
  },
  accent: {
    palette: {
      // Accent palette - gradient of the primary color
      light: [
        'rgb(255, 217, 225)', // lightest
        'rgb(255, 178, 193)', // lighter
        'rgb(255, 139, 161)', // light
        'rgb(240, 36, 117)', // primary
        'rgb(220, 32, 106)', // darker
        'rgb(200, 28, 95)', // even darker
        'rgb(180, 24, 84)', // much darker
        'rgb(160, 20, 73)', // very dark
        'rgb(140, 16, 62)', // very dark
        'rgb(120, 12, 51)', // very dark
        'rgb(100, 8, 40)', // very dark
        'rgb(80, 4, 29)', // darkest
      ],
      dark: [
        'rgb(255, 178, 193)', // lightest
        'rgb(255, 139, 161)', // lighter
        'rgb(255, 100, 129)', // light
        'rgb(240, 36, 117)', // primary
        'rgb(220, 32, 106)', // darker
        'rgb(200, 28, 95)', // even darker
        'rgb(180, 24, 84)', // much darker
        'rgb(160, 20, 73)', // very dark
        'rgb(140, 16, 62)', // very dark
        'rgb(120, 12, 51)', // very dark
        'rgb(100, 8, 40)', // very dark
        'rgb(80, 4, 29)', // darkest
      ],
    },
  },
});
