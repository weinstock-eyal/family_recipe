import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Types ---

export type Ingredient = {
  amount: string;
  unit: string;
  item: string;
};

export type IngredientGroup = {
  name?: string;
  items: Ingredient[];
};

export type InstructionSection = {
  name?: string;
  steps: string[];
};

// --- Tables ---

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Media (all optional)
  imageUrl: text("image_url"),
  youtubeUrl: text("youtube_url"),
  sourceUrl: text("source_url"),

  // Structured data (optional - core conditional logic depends on these)
  ingredients: jsonb("ingredients").$type<IngredientGroup[]>(),
  instructions: jsonb("instructions").$type<InstructionSection[]>(),
  tags: jsonb("tags").$type<string[]>(),

  // Social counters
  likes: integer("likes").default(0).notNull(),
  dislikes: integer("dislikes").default(0).notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const familyNotes = pgTable("family_notes", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 255 }).notNull(),
  note: text("note").notNull(),
  noteType: varchar("note_type", { length: 50 }).notNull().default("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const groceryListItems = pgTable("grocery_list_items", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  item: varchar("item", { length: 500 }).notNull(),
  amount: varchar("amount", { length: 100 }),
  unit: varchar("unit", { length: 100 }),
  checked: integer("checked").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

// --- Relations ---

export const recipesRelations = relations(recipes, ({ many }) => ({
  familyNotes: many(familyNotes),
}));

export const familyNotesRelations = relations(familyNotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [familyNotes.recipeId],
    references: [recipes.id],
  }),
}));
