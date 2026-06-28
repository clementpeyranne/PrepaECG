"use server";

import { UserRole } from "@prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCurrentUser,
  getUserLandingPath,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordFromToken,
  signOut
} from "@/lib/auth";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithParams(path: string, params: Record<string, string | undefined>): never {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  redirect((query ? `${path}?${query}` : path) as Route);
}

function redirectWithMessage(path: string, message: string): never {
  redirectWithParams(path, { message });
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

export async function forgotPasswordAction(formData: FormData) {
  const result = await requestPasswordReset(getString(formData, "email"));

  if (!result.ok) {
    redirectWithMessage("/forgot-password", result.message);
  }

  redirectWithParams("/forgot-password", {
    message: result.message,
    resetLink: result.resetLink ?? undefined
  });
}

export async function resetPasswordAction(formData: FormData) {
  const token = getString(formData, "token");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!token) {
    redirectWithMessage("/reset-password", "Le lien de reinitialisation est incomplet.");
  }

  if (!password || !confirmPassword) {
    redirectWithParams("/reset-password", {
      token,
      message: "Merci de remplir les deux champs."
    });
  }

  if (password !== confirmPassword) {
    redirectWithParams("/reset-password", {
      token,
      message: "Les deux mots de passe ne correspondent pas."
    });
  }

  const result = await resetPasswordFromToken({
    token,
    password
  });

  if (!result.ok) {
    redirectWithParams("/reset-password", {
      token,
      message: result.message
    });
  }

  const landingPath = await getUserLandingPath(result.user);
  revalidatePath("/");
  redirect(landingPath);
}
