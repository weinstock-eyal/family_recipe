import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  unique,
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
  shareWithAllByDefault: integer("share_with_all_by_default").default(1).notNull(),
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

// --- Family Groups ---

export const familyGroups = pgTable("family_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const familyGroupMembers = pgTable(
  "family_group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => familyGroups.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.groupId, t.userId)]
);

export const recipeGroupShares = pgTable(
  "recipe_group_shares",
  {
    id: serial("id").primaryKey(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => familyGroups.id, { onDelete: "cascade" }),
    sharedAt: timestamp("shared_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.recipeId, t.groupId)]
);

export const groupInvitations = pgTable("group_invitations", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => familyGroups.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  groupMemberships: many(familyGroupMembers),
  createdGroups: many(familyGroups),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  familyNotes: many(familyNotes),
  groupShares: many(recipeGroupShares),
}));

export const familyNotesRelations = relations(familyNotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [familyNotes.recipeId],
    references: [recipes.id],
  }),
}));

export const familyGroupsRelations = relations(familyGroups, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [familyGroups.createdById],
    references: [users.id],
  }),
  members: many(familyGroupMembers),
  recipeShares: many(recipeGroupShares),
  invitations: many(groupInvitations),
}));

export const familyGroupMembersRelations = relations(familyGroupMembers, ({ one }) => ({
  group: one(familyGroups, {
    fields: [familyGroupMembers.groupId],
    references: [familyGroups.id],
  }),
  user: one(users, {
    fields: [familyGroupMembers.userId],
    references: [users.id],
  }),
}));

export const recipeGroupSharesRelations = relations(recipeGroupShares, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeGroupShares.recipeId],
    references: [recipes.id],
  }),
  group: one(familyGroups, {
    fields: [recipeGroupShares.groupId],
    references: [familyGroups.id],
  }),
}));

export const groupInvitationsRelations = relations(groupInvitations, ({ one }) => ({
  group: one(familyGroups, {
    fields: [groupInvitations.groupId],
    references: [familyGroups.id],
  }),
  createdBy: one(users, {
    fields: [groupInvitations.createdById],
    references: [users.id],
  }),
}));
