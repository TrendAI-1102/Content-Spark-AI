import { GeneratedItem, ThemeSettings, ThemeMode, AccentColor } from '../types';

const HISTORY_KEY = 'contentSparkHistory';
const THEME_KEY = 'contentSparkTheme';

/**
 * Saves the generated items history to localStorage.
 * @param items - The array of generated items to save.
 */
export const saveHistory = (items: GeneratedItem[]): void => {
    try {
        const serializedState = JSON.stringify(items);
        localStorage.setItem(HISTORY_KEY, serializedState);
    } catch (error) {
        console.error("Could not save history to localStorage", error);
    }
};

/**
 * Loads the generated items history from localStorage.
 * @returns The array of generated items, or an empty array if not found or on error.
 */
export const loadHistory = (): GeneratedItem[] => {
    try {
        const serializedState = localStorage.getItem(HISTORY_KEY);
        if (serializedState === null) {
            return [];
        }
        return JSON.parse(serializedState);
    } catch (error) {
        console.error("Could not load history from localStorage", error);
        return [];
    }
};

/**
 * Saves the theme settings to localStorage.
 * @param settings - The theme settings object to save.
 */
export const saveThemeSettings = (settings: ThemeSettings): void => {
    try {
        const serializedState = JSON.stringify(settings);
        localStorage.setItem(THEME_KEY, serializedState);
    } catch (error) {
        console.error("Could not save theme to localStorage", error);
    }
};

/**
 * Loads the theme settings from localStorage.
 * @returns The theme settings object, or null if not found or on error.
 */
export const loadThemeSettings = (): ThemeSettings | null => {
    try {
        const serializedState = localStorage.getItem(THEME_KEY);
        if (serializedState === null) {
            return null;
        }
        return JSON.parse(serializedState) as ThemeSettings;
    } catch (error) {
        console.error("Could not load theme from localStorage", error);
        return null;
    }
};

export const defaultTheme: ThemeSettings = {
    mode: ThemeMode.LIGHT,
    accent: AccentColor.INDIGO,
};
