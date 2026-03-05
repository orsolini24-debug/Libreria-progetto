/**
 * middleware.ts
 *
 * Usa authConfig (edge-safe) invece dell'istanza completa di auth.ts.
 * Trade-off: auth.ts importa Prisma + @prisma/adapter-neon che sono Node.js.
 * Il middleware gira nel Edge Runtime di Next.js (V8 isolate, senza Node.js).
 * authConfig contiene solo i callback JWT/session e non importa Prisma:
 * può leggere il JWT dal cookie senza toccare il DB.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // req.auth è null se il JWT non esiste o è scaduto
  if (!req.auth) {
    const loginUrl = new URL("/", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  /**
   * Il route group (protected) scompare dall'URL: /dashboard e /room
   * sono le rotte reali. Il matcher NON include /api/auth/* per non
   * bloccare i callback di NextAuth stesso.
   */
  matcher: ["/dashboard/:path*", "/room/:path*"],
};
