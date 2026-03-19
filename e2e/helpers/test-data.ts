// Seed users
export const USERS = {
  mama: { email: "mama@family.com", password: "123456", displayName: "אמא" },
  eyal: { email: "weinstockey@gmail.com", password: "123456", displayName: "אייל" },
  yael: { email: "yael@family.com", password: "123456", displayName: "יעל" },
} as const;

// Seed recipes — title, owner, key properties
export const RECIPES = {
  chocolate: {
    title: "עוגת שוקולד של סבתא רחל",
    owner: "אמא",
    hasIngredients: false,
    hasYoutube: false,
    hasSource: false,
    likes: 3,
    tags: ["קינוחים", "חלבי", "אפייה"],
  },
  hummus: {
    title: "חומוס הבית",
    owner: "אבא",
    hasIngredients: true,
    ingredientCount: 6,
    instructionCount: 5,
    hasYoutube: false,
    hasSource: false,
    likes: 5,
    tags: ["טבעוני", "פרווה", "סלטים"],
  },
  shakshuka: {
    title: "שקשוקה מרוקאית",
    owner: "יעל",
    hasIngredients: false,
    hasYoutube: true,
    hasSource: false,
    likes: 2,
    tags: ["בשרי", "ארוחת בוקר", "מרוקאי"],
  },
  cookies: {
    title: "עוגיות חמאה פריכות",
    owner: "סבתא מרים",
    hasIngredients: true,
    ingredientCount: 5,
    instructionCount: 6,
    hasYoutube: false,
    hasSource: true,
    likes: 4,
    tags: ["קינוחים", "חלבי", "אפייה"],
  },
  tea: {
    title: "תה נענע של אמא",
    owner: "אמא",
    hasIngredients: true,
    ingredientCount: 4,
    instructionCount: 5,
    hasYoutube: false,
    hasSource: false,
    likes: 2,
    tags: ["משקאות", "פרווה"],
  },
} as const;

export const TOTAL_SEED_RECIPES = 5;
