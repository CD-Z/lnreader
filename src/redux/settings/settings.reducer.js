import {
    SET_APP_THEME,
    SET_NOVELS_PER_ROW,
    SET_READER_SETTINGS,
    SET_APP_SETTINGS,
    SET_ACCENT_COLOR,
    SET_RIPPLE_COLOR,
} from "./settings.types";
import {
    amoledDarkTheme,
    lightTheme,
    darkTheme,
    midnightDuskTheme,
    greenAppleTheme,
    irisBlueTheme,
    hotPinkTheme,
    strawberryDaiquiri,
    palenightTheme,
} from "../../theme/theme";
import { setRippleColor } from "./settings.actions";

const themes = {
    0: amoledDarkTheme,
    1: lightTheme,
    2: darkTheme,
    3: midnightDuskTheme,
    4: greenAppleTheme,
    5: irisBlueTheme,
    6: hotPinkTheme,
    7: strawberryDaiquiri,
    8: palenightTheme,
};

/**
 * Display Mode
 *
 * 0 -> Compact
 * 1 -> Comfortable
 * 2 -> List
 */

/**
 * Reader Theme
 *
 * 1 -> Dark
 * 2 -> White
 * 3 -> Sepia
 */

const initialState = {
    theme: darkTheme,
    displayMode: 0,
    novelsPerRow: 3,
    reader: {
        theme: 1,
        textColor: "rgba(255,255,255,0.7)",
        textSize: 16,
        textAlign: "left",
        padding: 5,
        fontFamily: "",
        lineHeight: 1.5,
    },
    showDownloadBadges: true,
    showUnreadBadges: true,
    showNumberOfNovels: false,
    showScrollPercentage: true,
    swipeGestures: true,
    incognitoMode: false,
    searchAllSources: false,
    textSelectable: false,
    updateLibraryOnLaunch: false,
};

const settingsReducer = (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case SET_APP_THEME:
            return { ...state, theme: themes[payload] };
        case SET_NOVELS_PER_ROW:
            return {
                ...state,
                novelsPerRow: state.displayMode !== 2 ? payload : 1,
            };
        case SET_ACCENT_COLOR:
            return {
                ...state,
                theme: {
                    ...state.theme,
                    colorAccent: payload,
                },
            };
        case SET_RIPPLE_COLOR:
            return {
                ...state,
                theme: {
                    ...state.theme,
                    rippleColor: payload,
                },
            };
        case SET_APP_SETTINGS:
            return {
                ...state,
                [payload.key]: payload.val,
            };
        case SET_READER_SETTINGS:
            return {
                ...state,
                reader: {
                    ...state.reader,
                    [payload.key]: payload.val,
                },
            };
        default:
            return state;
    }
};

export default settingsReducer;
