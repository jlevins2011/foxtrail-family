/**
 * Rename / retheme the hub from this file.
 * Colors are applied as CSS variables on <html> in the root layout.
 */
export const brand = {
  id: "questburrow",
  name: "Questburrow",
  shortName: "Questburrow",
  legalName: "Questburrow",
  tagline: "Learning adventures for curious kids.",
  pitch:
    "A quiet family hub for Sumtrail, Camp Compass, Keytrail, and Lumen Isles. Play the free demos anytime. A parent can start a 14-day full-family trial, then keep the library with one key. No ads. No chat. Parent email only.",
  description:
    "Questburrow is a shared home for Sumtrail, Camp Compass, Keytrail, and Lumen Isles. Demos are always free. A parent email unlocks a 14-day family trial, then $9.99/month or $99.90/year.",
  seoTitle: "Questburrow — Learning adventures for curious kids",
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
  cream: "#F5F7FA",
  parchment: "#E8DCC6",
  bark: "#2A2118",
  pine: "#143747",
  moss: "#236974",
  mist: "#526A78",
  lantern: "#E8A23A",
  ember: "#C45C26",
  fox: "#D46A2C",
  dusk: "#243B55",
  snow: "#FFFFFF",
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
