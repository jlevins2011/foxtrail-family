/**
 * Rename / retheme the hub from this file.
 * Colors are applied as CSS variables on <html> in the root layout.
 */
export const brand = {
  id: "foxtrail-family",
  name: "Foxtrail Family",
  shortName: "Foxtrail",
  legalName: "Foxtrail Family",
  tagline: "Camp games for curious kids. One family key for the trail.",
  pitch:
    "A quiet family hub for Camp Compass, Keytrail, and Lumen Isles — educational games you can try, then unlock together. No ads. No chat. Parent email only.",
  description:
    "Foxtrail Family is a shared home for three kid-friendly learning games. A parent signs in with email, unlocks the family library, and can add the hub to an iPad home screen.",
  mascots: {
    primary: {
      name: "Pip",
      role: "lantern fox",
      note: "Appears in Camp Compass and Keytrail.",
    },
    sibling: {
      name: "Lumen",
      role: "island light",
      note: "Sibling spirit of Lumen Isles.",
    },
  },
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  locale: "en-US",
} as const;

export const theme = {
  cream: "#F7F0E4",
  parchment: "#E8DCC6",
  bark: "#2A2118",
  pine: "#1F3A2E",
  moss: "#3D5A45",
  mist: "#7F9886",
  lantern: "#E8A23A",
  ember: "#C45C26",
  fox: "#D46A2C",
  dusk: "#243B55",
  snow: "#FFF8EE",
} as const;

export const themeCssVars: Record<string, string> = {
  "--cream": theme.cream,
  "--parchment": theme.parchment,
  "--bark": theme.bark,
  "--pine": theme.pine,
  "--moss": theme.moss,
  "--mist": theme.mist,
  "--lantern": theme.lantern,
  "--ember": theme.ember,
  "--fox": theme.fox,
  "--dusk": theme.dusk,
  "--snow": theme.snow,
};

export const clerkAppearance = {
  variables: {
    colorPrimary: theme.moss,
    colorBackground: theme.cream,
    colorText: theme.bark,
    colorInputBackground: theme.snow,
    borderRadius: "16px",
    fontFamily: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-[color:var(--parchment)]",
    headerTitle: "font-[family-name:var(--font-fraunces)]",
    formButtonPrimary: "bg-[color:var(--pine)] hover:bg-[color:var(--moss)]",
  },
};
