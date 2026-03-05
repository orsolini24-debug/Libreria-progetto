"use server";

import { signIn, auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { logger } from "./logger";

export type AuthActionState = { error?: string; success?: string } | null;

/**
 * #150: Gestione login con messaggi coerenti
 */
export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e password sono obbligatorie." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { success: "Accesso in corso..." };
  } catch (error) {
    if (error instanceof AuthError) {
      // #65: Distingui tra errore credenziali e altri errori
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email o password non corretti." };
        default:
          return { error: "Errore durante l'accesso. Riprova." };
      }
    }
    // NEXT_REDIRECT non deve essere catturato
    throw error;
  }
}

/**
 * #14, #150, #78: Registrazione con auto-login e requisiti chiari
 */
export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e password sono obbligatorie." };
  }

  // #78: Password requirements (almeno 8 caratteri)
  if (password.length < 8) {
    return { error: "La password deve contenere almeno 8 caratteri." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Questa email è già registrata." };
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ 
      data: { 
        email, 
        password: hashed 
      } 
    });

    // #14: Auto-login dopo registrazione riuscita
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { success: "Account creato! Accesso in corso..." };

  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account creato, ma il login automatico è fallito. Prova ad accedere manualmente." };
    }
    logger.error("REGISTER_ACTION_ERROR", error);
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    return { error: "Errore durante la creazione dell'account. Riprova." };
  }
}

export async function setDisplayName(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const name = (formData.get("displayName") as string)?.trim();
  if (!name || name.length < 2) return { error: "Inserisci almeno 2 caratteri." };
  if (name.length > 40)         return { error: "Nome troppo lungo (max 40 caratteri)." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { displayName: name },
    });

    revalidatePath("/dashboard");
    return { success: "Nome aggiornato con successo!" };
  } catch (e) {
    logger.error("SET_DISPLAY_NAME_ERROR", e);
    return { error: "Errore durante l'aggiornamento del nome." };
  }
}
