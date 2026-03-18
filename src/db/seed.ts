import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users, recipes, familyNotes, groceryListItems } from "./schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(groceryListItems);
  await db.delete(familyNotes);
  await db.delete(recipes);
  await db.delete(users);

  // --- Seed Users ---
  const passwordHash = await bcrypt.hash("123456", 12);

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: "eyal@example.com",
        passwordHash,
        displayName: "אייל",
        role: "admin",
      },
      {
        email: "mama@family.com",
        passwordHash,
        displayName: "אמא",
        role: "member",
      },
      {
        email: "yael@family.com",
        passwordHash,
        displayName: "יעל",
        role: "member",
      },
    ])
    .returning({ id: users.id, displayName: users.displayName });

  console.log("Inserted users:", insertedUsers);

  // --- Seed Recipes ---
  const insertedRecipes = await db
    .insert(recipes)
    .values([
      {
        title: "עוגת שוקולד של סבתא רחל",
        uploadedBy: "אמא",
        imageUrl: "https://placehold.co/800x600?text=Chocolate+Cake",
        ingredients: null,
        instructions: null,
        tags: ["קינוחים", "חלבי", "אפייה"],
        likes: 3,
        dislikes: 0,
      },
      {
        title: "חומוס הבית",
        uploadedBy: "אבא",
        imageUrl: "https://placehold.co/800x600?text=Hummus",
        ingredients: [
          {
            items: [
              { amount: "2", unit: "כוסות", item: "חומוס יבש" },
              { amount: "1", unit: "כפית", item: "סודה לשתייה" },
              { amount: "3", unit: "כפות", item: "טחינה גולמית" },
              { amount: "1", unit: "יחידה", item: "לימון" },
              { amount: "2", unit: "שיניים", item: "שום" },
              { amount: "1", unit: "כפית", item: "מלח" },
            ],
          },
        ],
        instructions: [
          {
            steps: [
              "להשרות את החומוס למשך לילה שלם במים",
              "לבשל עם סודה לשתייה עד שהחומוס מתרכך לגמרי (כשעה)",
              "לסנן ולשטוף במים קרים",
              "לטחון בבלנדר עם טחינה, לימון, שום ומלח",
              "להוסיף מי בישול עד לקבלת מרקם חלק",
            ],
          },
        ],
        tags: ["טבעוני", "פרווה", "סלטים"],
        likes: 5,
        dislikes: 1,
      },
      {
        title: "שקשוקה מרוקאית",
        uploadedBy: "יעל",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ingredients: null,
        instructions: null,
        tags: ["בשרי", "ארוחת בוקר", "מרוקאי"],
        likes: 2,
        dislikes: 0,
      },
      {
        title: "עוגיות חמאה פריכות",
        uploadedBy: "סבתא מרים",
        sourceUrl: "https://www.10dakot.co.il/recipe/butter-cookies",
        ingredients: [
          {
            items: [
              { amount: "200", unit: "גרם", item: "חמאה" },
              { amount: "1", unit: "כוס", item: "סוכר" },
              { amount: "1", unit: "יחידה", item: "ביצה" },
              { amount: "3", unit: "כוסות", item: "קמח" },
              { amount: "1", unit: "כפית", item: "תמצית וניל" },
            ],
          },
        ],
        instructions: [
          {
            steps: [
              "לערבב חמאה רכה עם סוכר עד לקבלת קרם",
              "להוסיף ביצה ווניל ולערבב",
              "להוסיף קמח בהדרגה עד לקבלת בצק אחיד",
              "לצנן במקרר חצי שעה",
              "לרדד ולחתוך צורות",
              "לאפות ב-180 מעלות כ-12 דקות",
            ],
          },
        ],
        tags: ["קינוחים", "חלבי", "אפייה"],
        likes: 4,
        dislikes: 0,
      },
      {
        title: "תה נענע של אמא",
        uploadedBy: "אמא",
        ingredients: [
          {
            items: [
              { amount: "4", unit: "כוסות", item: "מים רותחים" },
              { amount: "2", unit: "כפיות", item: "עלי תה שחור" },
              { amount: "1", unit: "חבילה", item: "נענע טרייה" },
              { amount: "3", unit: "כפות", item: "סוכר" },
            ],
          },
        ],
        instructions: [
          {
            steps: [
              "להרתיח מים",
              "להוסיף עלי תה ולחכות דקה",
              "להוסיף ענפי נענע ולערבב",
              "להוסיף סוכר לפי הטעם",
              "לתת לחלוט 3 דקות ולהגיש",
            ],
          },
        ],
        tags: ["משקאות", "פרווה"],
        likes: 2,
        dislikes: 0,
      },
    ])
    .returning({ id: recipes.id, title: recipes.title });

  console.log("Inserted recipes:", insertedRecipes);

  // Map recipe titles to IDs for family notes
  const recipeMap = Object.fromEntries(
    insertedRecipes.map((r) => [r.title, r.id])
  );

  // --- Seed Family Notes ---
  const insertedNotes = await db
    .insert(familyNotes)
    .values([
      {
        recipeId: recipeMap["חומוס הבית"],
        author: "אמא",
        note: "אני מוסיפה קצת כמון, זה עושה הבדל ענק",
        noteType: "tip",
      },
      {
        recipeId: recipeMap["חומוס הבית"],
        author: "יעל",
        note: "ניסיתי עם שלושה לימונים במקום אחד, יצא יותר טוב",
        noteType: "change",
      },
      {
        recipeId: recipeMap["עוגת שוקולד של סבתא רחל"],
        author: "אבא",
        note: "העוגה הכי טובה בעולם, אל תשנו כלום!",
        noteType: "comment",
      },
      {
        recipeId: recipeMap["עוגיות חמאה פריכות"],
        author: "אמא",
        note: "אני משתמשת במרגרינה במקום חמאה ויוצא לא פחות טוב",
        noteType: "change",
      },
      {
        recipeId: recipeMap["תה נענע של אמא"],
        author: "יעל",
        note: "אפשר להוסיף גם עלי לואיזה, נותן טעם מדהים",
        noteType: "tip",
      },
    ])
    .returning({ id: familyNotes.id });

  console.log("Inserted family notes:", insertedNotes);
  console.log("Seeding complete!");

  await sql.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await sql.end();
  process.exit(1);
});
