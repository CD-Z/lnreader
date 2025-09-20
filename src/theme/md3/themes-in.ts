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

const t = {
  $accent1: { val: 'hsla(348, 100%, 85%, 1)' },
  $accent2: { val: 'hsla(349, 100%, 77%, 1)' },
  $accent3: { val: 'hsla(349, 100%, 70%, 1)' },
  $accent4: { val: 'hsla(336, 87%, 54%, 1)' },
  $accent5: { val: 'hsla(336, 75%, 49%, 1)' },
  $accent6: { val: 'hsla(337, 75%, 45%, 1)' },
  $accent7: { val: 'hsla(337, 76%, 40%, 1)' },
  $accent8: { val: 'hsla(337, 78%, 35%, 1)' },
  $accent9: { val: 'hsla(338, 79%, 31%, 1)' },
  $accent10: { val: 'hsla(338, 82%, 26%, 1)' },
  $accent11: { val: 'hsla(339, 85%, 21%, 1)' },
  $accent12: { val: 'hsla(340, 90%, 16%, 1)' },
  $accentBackground: { val: 'hsla(338, 82%, 26%, 1)' },
  $accentColor: { val: 'hsla(349, 100%, 70%, 1)' },
  $background: { val: 'hsla(248, 16%, 10%, 1)' },
  $background0: { val: 'hsla(253, 18%, 10%, 0)' },
  $background02: { val: 'hsla(253, 18%, 10%, 0.2)' },
  $background04: { val: 'hsla(253, 18%, 10%, 0.4)' },
  $background06: { val: 'hsla(253, 18%, 10%, 0.6)' },
  $background08: { val: 'hsla(253, 18%, 10%, 0.8)' },
  $backgroundFocus: { val: 'hsla(253, 18%, 10%, 0.8)' },
  $backgroundHover: { val: 'hsla(248, 13%, 12%, 1)' },
  $backgroundPress: { val: 'hsla(253, 18%, 10%, 0.8)' },
  $borderColor: { val: 'hsla(248, 10%, 16%, 1)' },
  $borderColorFocus: { val: 'hsla(248, 10%, 16%, 1)' },
  $borderColorHover: { val: 'hsla(248, 9%, 18%, 1)' },
  $borderColorPress: { val: 'hsla(248, 11%, 14%, 1)' },
  $color: { val: 'hsla(300, 7%, 89%, 1)' },
  $color0: { val: 'hsla(300, 7%, 89%, 0)' },
  $color1: { val: 'hsla(248, 16%, 10%, 1)' },
  $color02: { val: 'hsla(300, 7%, 89%, 0.2)' },
  $color2: { val: 'hsla(248, 13%, 12%, 1)' },
  $color3: { val: 'hsla(248, 11%, 14%, 1)' },
  $color04: { val: 'hsla(300, 7%, 89%, 0.4)' },
  $color4: { val: 'hsla(248, 10%, 16%, 1)' },
  $color5: { val: 'hsla(248, 9%, 18%, 1)' },
  $color06: { val: 'hsla(300, 7%, 89%, 0.6)' },
  $color6: { val: 'hsla(248, 8%, 20%, 1)' },
  $color7: { val: 'hsla(248, 7%, 22%, 1)' },
  $color08: { val: 'hsla(300, 7%, 89%, 0.8)' },
  $color8: { val: 'hsla(248, 7%, 24%, 1)' },
  $color9: { val: 'hsla(248, 6%, 25%, 1)' },
  $color10: { val: 'hsla(248, 6%, 27%, 1)' },
  $color11: { val: 'hsla(248, 5%, 29%, 1)' },
  $color12: { val: 'hsla(300, 7%, 89%, 1)' },
  $colorFocus: { val: 'hsla(248, 5%, 29%, 1)' },
  $colorHover: { val: 'hsla(248, 5%, 29%, 1)' },
  $colorPress: { val: 'hsla(300, 7%, 89%, 1)' },
  $colorTransparent: { val: 'hsla(300, 7%, 89%, 0)' },
  $outlineColor: { val: 'hsla(300, 7%, 89%, 0.2)' },
  $placeholderColor: { val: 'hsla(248, 6%, 25%, 1)' },
  accent1: { val: 'hsla(348, 100%, 85%, 1)' },
  accent2: { val: 'hsla(349, 100%, 77%, 1)' },
  accent3: { val: 'hsla(349, 100%, 70%, 1)' },
  accent4: { val: 'hsla(336, 87%, 54%, 1)' },
  accent5: { val: 'hsla(336, 75%, 49%, 1)' },
  accent6: { val: 'hsla(337, 75%, 45%, 1)' },
  accent7: { val: 'hsla(337, 76%, 40%, 1)' },
  accent8: { val: 'hsla(337, 78%, 35%, 1)' },
  accent9: { val: 'hsla(338, 79%, 31%, 1)' },
  accent10: { val: 'hsla(338, 82%, 26%, 1)' },
  accent11: { val: 'hsla(339, 85%, 21%, 1)' },
  accent12: { val: 'hsla(340, 90%, 16%, 1)' },
  accentBackground: { val: 'hsla(338, 82%, 26%, 1)' },
  accentColor: { val: 'hsla(349, 100%, 70%, 1)' },
  background: { val: 'hsla(248, 16%, 10%, 1)' },
  background0: { val: 'hsla(253, 18%, 10%, 0)' },
  background02: { val: 'hsla(253, 18%, 10%, 0.2)' },
  background04: { val: 'hsla(253, 18%, 10%, 0.4)' },
  background06: { val: 'hsla(253, 18%, 10%, 0.6)' },
  background08: { val: 'hsla(253, 18%, 10%, 0.8)' },
  backgroundFocus: { val: 'hsla(253, 18%, 10%, 0.8)' },
  backgroundHover: { val: 'hsla(248, 13%, 12%, 1)' },
  backgroundPress: { val: 'hsla(253, 18%, 10%, 0.8)' },
  borderColor: { val: 'hsla(248, 10%, 16%, 1)' },
  borderColorFocus: { val: 'hsla(248, 10%, 16%, 1)' },
  borderColorHover: { val: 'hsla(248, 9%, 18%, 1)' },
  borderColorPress: { val: 'hsla(248, 11%, 14%, 1)' },
  color: { val: 'hsla(300, 7%, 89%, 1)' },
  color0: { val: 'hsla(300, 7%, 89%, 0)' },
  color1: { val: 'hsla(248, 16%, 10%, 1)' },
  color02: { val: 'hsla(300, 7%, 89%, 0.2)' },
  color2: { val: 'hsla(248, 13%, 12%, 1)' },
  color3: { val: 'hsla(248, 11%, 14%, 1)' },
  color04: { val: 'hsla(300, 7%, 89%, 0.4)' },
  color4: { val: 'hsla(248, 10%, 16%, 1)' },
  color5: { val: 'hsla(248, 9%, 18%, 1)' },
  color06: { val: 'hsla(300, 7%, 89%, 0.6)' },
  color6: { val: 'hsla(248, 8%, 20%, 1)' },
  color7: { val: 'hsla(248, 7%, 22%, 1)' },
  color08: { val: 'hsla(300, 7%, 89%, 0.8)' },
  color8: { val: 'hsla(248, 7%, 24%, 1)' },
  color9: { val: 'hsla(248, 6%, 25%, 1)' },
  color10: { val: 'hsla(248, 6%, 27%, 1)' },
  color11: { val: 'hsla(248, 5%, 29%, 1)' },
  color12: { val: 'hsla(300, 7%, 89%, 1)' },
  colorFocus: { val: 'hsla(248, 5%, 29%, 1)' },
  colorHover: { val: 'hsla(248, 5%, 29%, 1)' },
  colorPress: { val: 'hsla(300, 7%, 89%, 1)' },
  colorTransparent: { val: 'hsla(300, 7%, 89%, 0)' },
  outlineColor: { val: 'hsla(300, 7%, 89%, 0.2)' },
  placeholderColor: { val: 'hsla(248, 6%, 25%, 1)' },
};
