"use server";

import { UserRole } from "@prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, getUserLandingPath, loginUser, registerUser, signOut } from "@/lib/auth";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}` as Route);
}

export async function loginAction(formData: FormData) {
  const result = await loginUser({
    email: getString(formData, "email"),
    password: getString(formData, "password")
  });

  if (!result.ok) {
    redirectWithMessage("/login", result.message);
  }

  const landingPath = await getUserLandingPath(result.user);
  revalidatePath("/");
  redirect(landingPath);
}

export async function signupAction(formData: FormData) {
  const rawRole = getString(formData, "role");
  const role = rawRole === "teacher" ? UserRole.TEACHER : UserRole.STUDENT;

  const result = await registerUser({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    role,
    accessCode: getString(formData, "accessCode")
  });

  if (!result.ok) {
    redirectWithMessage("/signup", result.message);
  }

  const landingPath = await getUserLandingPath(result.user);
  revalidatePath("/");
  redirect(landingPath);
}

export async function logoutAction() {
  await signOut();
  revalidatePath("/");
  redirect("/login");
}

export async function continueAsCurrentUserAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const landingPath = await getUserLandingPath(user);
  redirect(landingPath);
}
