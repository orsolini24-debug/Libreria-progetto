"use server";

import { signIn, auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

type ActionState = { error: string } | null;

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o password non validi." };
    }
    throw error; // re-lancia il NEXT_REDIRECT
  }

  return null;
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e password sono obbligatorie." };
  }

  if (password.length < 8) {
    return { error: "La password deve essere di almeno 8 caratteri." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email già registrata." };
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, password: hashed } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registrazione completata ma login fallito." };
    }
    throw error;
  }

  return null;
}

export async function setDisplayName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const name = (formData.get("displayName") as string)?.trim();
  if (!name || name.length < 2) return { error: "Inserisci almeno 2 caratteri." };
  if (name.length > 40)         return { error: "Nome troppo lungo (max 40 caratteri)." };

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { displayName: name },
  });

  revalidatePath("/dashboard");
  return null;
}
