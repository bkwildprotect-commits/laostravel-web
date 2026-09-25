export const locales=["en","lo","th","vi","zh","fr","ko"] as const;
export type Locale=(typeof locales)[number];
export const defaultLocale:Locale="en";
