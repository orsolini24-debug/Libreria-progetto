import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Necessario per deployment su Vercel, Railway, Render, Docker o accesso da rete locale.
  // Permette a NextAuth di accettare richieste da qualsiasi host (AUTH_URL non deve combaciare).
  trustHost: true,
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [],
};
