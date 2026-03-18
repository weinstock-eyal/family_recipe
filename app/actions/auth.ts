"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/src/lib/auth";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
