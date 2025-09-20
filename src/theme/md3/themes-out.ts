// @ts-nocheck
type Theme = {
  accentBackground: string;
  accentColor: string;
  background0: string;
  background02: string;
  background04: string;
  background06: string;
  background08: string;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  color7: string;
  color8: string;
  color9: string;
  color10: string;
  color11: string;
  color12: string;
  color0: string;
  color02: string;
  color04: string;
  color06: string;
  color08: string;
  background: string;
  backgroundHover: string;
  backgroundPress: string;
  backgroundFocus: string;
  borderColor: string;
  borderColorHover: string;
  borderColorPress: string;
  borderColorFocus: string;
  color: string;
  colorHover: string;
  colorPress: string;
  colorFocus: string;
  placeholderColor: string;
  outlineColor: string;
  colorTransparent: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  accent7: string;
  accent8: string;
  accent9: string;
  accent10: string;
  accent11: string;
  accent12: string;

}

function t(a: [number, number][]) {
  let res: Record<string,string> = {}
  for (const [ki, vi] of a) {
    res[ks[ki] as string] = colors[vi] as string
  }
  return res as Theme
}
export const colors = [
  'hsla(349, 100%, 77%, 1)',
  'hsla(338, 82%, 26%, 1)',
  'hsla(300, 100%, 99%, 0)',
  'hsla(300, 100%, 99%, 0.2)',
  'hsla(300, 100%, 99%, 0.4)',
  'hsla(300, 100%, 99%, 0.6)',
  'hsla(300, 100%, 99%, 0.8)',
  'hsla(300, 100%, 99%, 1)',
  'hsla(300, 33%, 97%, 1)',
  'hsla(300, 20%, 95%, 1)',
  'hsla(300, 14%, 93%, 1)',
  'hsla(300, 11%, 91%, 1)',
  'hsla(300, 9%, 89%, 1)',
  'hsla(300, 8%, 87%, 1)',
  'hsla(300, 7%, 85%, 1)',
  'hsla(300, 6%, 83%, 1)',
  'hsla(300, 5%, 81%, 1)',
  'hsla(300, 5%, 79%, 1)',
  'hsla(255, 7%, 11%, 1)',
  'hsla(255, 7%, 11%, 0)',
  'hsla(255, 7%, 11%, 0.2)',
  'hsla(255, 7%, 11%, 0.4)',
  'hsla(255, 7%, 11%, 0.6)',
  'hsla(255, 7%, 11%, 0.8)',
  'hsla(347, 100%, 93%, 1)',
  'hsla(348, 100%, 85%, 1)',
  'hsla(336, 87%, 54%, 1)',
  'hsla(336, 75%, 49%, 1)',
  'hsla(337, 75%, 45%, 1)',
  'hsla(337, 76%, 40%, 1)',
  'hsla(337, 78%, 35%, 1)',
  'hsla(338, 79%, 31%, 1)',
  'hsla(339, 85%, 21%, 1)',
  'hsla(340, 90%, 16%, 1)',
  'hsla(349, 100%, 70%, 1)',
  'hsla(253, 18%, 10%, 0)',
  'hsla(253, 18%, 10%, 0.2)',
  'hsla(253, 18%, 10%, 0.4)',
  'hsla(253, 18%, 10%, 0.6)',
  'hsla(253, 18%, 10%, 0.8)',
  'hsla(248, 16%, 10%, 1)',
  'hsla(248, 13%, 12%, 1)',
  'hsla(248, 11%, 14%, 1)',
  'hsla(248, 10%, 16%, 1)',
  'hsla(248, 9%, 18%, 1)',
  'hsla(248, 8%, 20%, 1)',
  'hsla(248, 7%, 22%, 1)',
  'hsla(248, 7%, 24%, 1)',
  'hsla(248, 6%, 25%, 1)',
  'hsla(248, 6%, 27%, 1)',
  'hsla(248, 5%, 29%, 1)',
  'hsla(300, 7%, 89%, 1)',
  'hsla(300, 7%, 89%, 0)',
  'hsla(300, 7%, 89%, 0.2)',
  'hsla(300, 7%, 89%, 0.4)',
  'hsla(300, 7%, 89%, 0.6)',
  'hsla(300, 7%, 89%, 0.8)',
  'hsla(347, 100%, 93%, 0)',
  'hsla(347, 100%, 93%, 0.2)',
  'hsla(347, 100%, 93%, 0.4)',
  'hsla(347, 100%, 93%, 0.6)',
  'hsla(347, 100%, 93%, 0.8)',
  'hsla(340, 90%, 16%, 0)',
  'hsla(340, 90%, 16%, 0.2)',
  'hsla(340, 90%, 16%, 0.4)',
  'hsla(340, 90%, 16%, 0.6)',
  'hsla(340, 90%, 16%, 0.8)',
  'hsla(348, 100%, 85%, 0)',
  'hsla(348, 100%, 85%, 0.2)',
  'hsla(348, 100%, 85%, 0.4)',
  'hsla(348, 100%, 85%, 0.6)',
  'hsla(348, 100%, 85%, 0.8)',
]

const ks = [
'accentBackground',
'accentColor',
'background0',
'background02',
'background04',
'background06',
'background08',
'color1',
'color2',
'color3',
'color4',
'color5',
'color6',
'color7',
'color8',
'color9',
'color10',
'color11',
'color12',
'color0',
'color02',
'color04',
'color06',
'color08',
'background',
'backgroundHover',
'backgroundPress',
'backgroundFocus',
'borderColor',
'borderColorHover',
'borderColorPress',
'borderColorFocus',
'color',
'colorHover',
'colorPress',
'colorFocus',
'placeholderColor',
'outlineColor',
'colorTransparent',
'accent1',
'accent2',
'accent3',
'accent4',
'accent5',
'accent6',
'accent7',
'accent8',
'accent9',
'accent10',
'accent11',
'accent12']


const n1 = t([[0, 0],[1, 1],[2, 2],[3, 3],[4, 4],[5, 5],[6, 6],[7, 7],[8, 8],[9, 9],[10, 10],[11, 11],[12, 12],[13, 13],[14, 14],[15, 15],[16, 16],[17, 17],[18, 18],[19, 19],[20, 20],[21, 21],[22, 22],[23, 23],[24, 7],[25, 6],[26, 8],[27, 8],[28, 10],[29, 9],[30, 11],[31, 10],[32, 18],[33, 17],[34, 18],[35, 17],[36, 15],[37, 20],[38, 19],[39, 24],[40, 25],[41, 0],[42, 26],[43, 27],[44, 28],[45, 29],[46, 30],[47, 31],[48, 1],[49, 32],[50, 33]])
const n2 = t([[0, 1],[1, 34],[2, 35],[3, 36],[4, 37],[5, 38],[6, 39],[7, 40],[8, 41],[9, 42],[10, 43],[11, 44],[12, 45],[13, 46],[14, 47],[15, 48],[16, 49],[17, 50],[18, 51],[19, 52],[20, 53],[21, 54],[22, 55],[23, 56],[24, 40],[25, 41],[26, 39],[27, 39],[28, 43],[29, 44],[30, 42],[31, 43],[32, 51],[33, 50],[34, 51],[35, 50],[36, 48],[37, 53],[38, 52],[39, 25],[40, 0],[41, 34],[42, 26],[43, 27],[44, 28],[45, 29],[46, 30],[47, 31],[48, 1],[49, 32],[50, 33]])
const n3 = t([[0, 9],[1, 16],[2, 57],[3, 58],[4, 59],[5, 60],[6, 61],[7, 24],[8, 25],[9, 0],[10, 26],[11, 27],[12, 28],[13, 29],[14, 30],[15, 31],[16, 1],[17, 32],[18, 33],[19, 62],[20, 63],[21, 64],[22, 65],[23, 66],[24, 24],[25, 61],[26, 25],[27, 25],[28, 26],[29, 0],[30, 27],[31, 26],[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[38, 62]])
const n4 = t([[0, 49],[1, 42],[2, 67],[3, 68],[4, 69],[5, 70],[6, 71],[7, 25],[8, 0],[9, 34],[10, 26],[11, 27],[12, 28],[13, 29],[14, 30],[15, 31],[16, 1],[17, 32],[18, 33],[19, 62],[20, 63],[21, 64],[22, 65],[23, 66],[24, 25],[25, 0],[26, 71],[27, 71],[28, 26],[29, 27],[30, 34],[31, 26],[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[38, 62]])
const n5 = t([[32, 18],[33, 17],[34, 18],[35, 17],[36, 15],[37, 20],[24, 8],[25, 7],[26, 9],[27, 9],[28, 11],[29, 10],[31, 11],[30, 12]])
const n6 = t([[32, 18],[33, 17],[34, 18],[35, 17],[36, 15],[37, 20],[24, 10],[25, 9],[26, 11],[27, 11],[28, 13],[29, 12],[31, 13],[30, 14]])
const n7 = t([[32, 18],[33, 17],[34, 18],[35, 17],[36, 15],[37, 20],[24, 9],[25, 8],[26, 10],[27, 10],[28, 12],[29, 11],[31, 12],[30, 13]])
const n8 = t([[0, 1],[1, 0],[2, 19],[3, 20],[4, 21],[5, 22],[6, 23],[7, 18],[8, 17],[9, 16],[10, 15],[11, 14],[12, 13],[13, 12],[14, 11],[15, 10],[16, 9],[17, 8],[18, 7],[19, 2],[20, 3],[21, 4],[22, 5],[23, 6],[24, 18],[25, 23],[26, 17],[27, 17],[28, 15],[29, 16],[30, 14],[31, 15],[32, 7],[33, 8],[34, 7],[35, 8],[36, 10],[37, 3],[38, 2]])
const n9 = t([[32, 51],[33, 50],[34, 51],[35, 50],[36, 48],[37, 53],[24, 41],[25, 42],[26, 40],[27, 40],[28, 44],[29, 45],[31, 44],[30, 43]])
const n10 = t([[32, 51],[33, 50],[34, 51],[35, 50],[36, 48],[37, 53],[24, 43],[25, 44],[26, 42],[27, 42],[28, 46],[29, 47],[31, 46],[30, 45]])
const n11 = t([[32, 51],[33, 50],[34, 51],[35, 50],[36, 48],[37, 53],[24, 42],[25, 43],[26, 41],[27, 41],[28, 45],[29, 46],[31, 45],[30, 44]])
const n12 = t([[0, 34],[1, 1],[2, 52],[3, 53],[4, 54],[5, 55],[6, 56],[7, 51],[8, 50],[9, 49],[10, 48],[11, 47],[12, 46],[13, 45],[14, 44],[15, 43],[16, 42],[17, 41],[18, 40],[19, 35],[20, 36],[21, 37],[22, 38],[23, 39],[24, 51],[25, 50],[26, 56],[27, 56],[28, 48],[29, 47],[30, 49],[31, 48],[32, 40],[33, 41],[34, 40],[35, 41],[36, 43],[37, 36],[38, 35]])
const n13 = t([[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[24, 25],[25, 24],[26, 0],[27, 0],[28, 27],[29, 26],[31, 27],[30, 28]])
const n14 = t([[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[24, 26],[25, 0],[26, 27],[27, 27],[28, 29],[29, 28],[31, 29],[30, 30]])
const n15 = t([[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[24, 0],[25, 25],[26, 26],[27, 26],[28, 28],[29, 27],[31, 28],[30, 29]])
const n16 = t([[0, 16],[1, 9],[2, 62],[3, 63],[4, 64],[5, 65],[6, 66],[7, 33],[8, 32],[9, 1],[10, 31],[11, 30],[12, 29],[13, 28],[14, 27],[15, 26],[16, 0],[17, 25],[18, 24],[19, 57],[20, 58],[21, 59],[22, 60],[23, 61],[24, 33],[25, 66],[26, 32],[27, 32],[28, 31],[29, 1],[30, 30],[31, 31],[32, 24],[33, 25],[34, 24],[35, 25],[36, 26],[37, 58],[38, 57]])
const n17 = t([[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[24, 0],[25, 34],[26, 25],[27, 25],[28, 27],[29, 28],[31, 27],[30, 26]])
const n18 = t([[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[24, 26],[25, 27],[26, 34],[27, 34],[28, 29],[29, 30],[31, 29],[30, 28]])
const n19 = t([[32, 33],[33, 32],[34, 33],[35, 32],[36, 31],[37, 63],[24, 34],[25, 26],[26, 0],[27, 0],[28, 28],[29, 29],[31, 28],[30, 27]])
const n20 = t([[0, 42],[1, 49],[2, 62],[3, 63],[4, 64],[5, 65],[6, 66],[7, 33],[8, 32],[9, 1],[10, 31],[11, 30],[12, 29],[13, 28],[14, 27],[15, 26],[16, 34],[17, 0],[18, 25],[19, 67],[20, 68],[21, 69],[22, 70],[23, 71],[24, 33],[25, 32],[26, 66],[27, 66],[28, 31],[29, 30],[30, 1],[31, 31],[32, 25],[33, 0],[34, 25],[35, 0],[36, 26],[37, 68],[38, 67]])

type ThemeNames =
 | 'light'
 | 'dark'
 | 'light_accent'
 | 'dark_accent'

export const themes: Record<ThemeNames, Theme> = {
  light: n1,
  dark: n2,
  light_accent: n3,
  dark_accent: n4,
  light_ListItem: n5,
  light_SelectTrigger: n5,
  light_Card: n5,
  light_Progress: n5,
  light_TooltipArrow: n5,
  light_SliderTrack: n5,
  light_Input: n5,
  light_TextArea: n5,
  light_Button: n6,
  light_SliderTrackActive: n6,
  light_Checkbox: n7,
  light_Switch: n7,
  light_TooltipContent: n7,
  light_RadioGroupItem: n7,
  light_SwitchThumb: n8,
  light_SliderThumb: n8,
  light_Tooltip: n8,
  light_ProgressIndicator: n8,
  dark_ListItem: n9,
  dark_SelectTrigger: n9,
  dark_Card: n9,
  dark_Progress: n9,
  dark_TooltipArrow: n9,
  dark_SliderTrack: n9,
  dark_Input: n9,
  dark_TextArea: n9,
  dark_Button: n10,
  dark_SliderTrackActive: n10,
  dark_Checkbox: n11,
  dark_Switch: n11,
  dark_TooltipContent: n11,
  dark_RadioGroupItem: n11,
  dark_SwitchThumb: n12,
  dark_SliderThumb: n12,
  dark_Tooltip: n12,
  dark_ProgressIndicator: n12,
  light_accent_ListItem: n13,
  light_accent_SelectTrigger: n13,
  light_accent_Card: n13,
  light_accent_Progress: n13,
  light_accent_TooltipArrow: n13,
  light_accent_SliderTrack: n13,
  light_accent_Input: n13,
  light_accent_TextArea: n13,
  light_accent_Button: n14,
  light_accent_SliderTrackActive: n14,
  light_accent_Checkbox: n15,
  light_accent_Switch: n15,
  light_accent_TooltipContent: n15,
  light_accent_RadioGroupItem: n15,
  light_accent_SwitchThumb: n16,
  light_accent_SliderThumb: n16,
  light_accent_Tooltip: n16,
  light_accent_ProgressIndicator: n16,
  dark_accent_ListItem: n17,
  dark_accent_SelectTrigger: n17,
  dark_accent_Card: n17,
  dark_accent_Progress: n17,
  dark_accent_TooltipArrow: n17,
  dark_accent_SliderTrack: n17,
  dark_accent_Input: n17,
  dark_accent_TextArea: n17,
  dark_accent_Button: n18,
  dark_accent_SliderTrackActive: n18,
  dark_accent_Checkbox: n19,
  dark_accent_Switch: n19,
  dark_accent_TooltipContent: n19,
  dark_accent_RadioGroupItem: n19,
  dark_accent_SwitchThumb: n20,
  dark_accent_SliderThumb: n20,
  dark_accent_Tooltip: n20,
  dark_accent_ProgressIndicator: n20,
}
