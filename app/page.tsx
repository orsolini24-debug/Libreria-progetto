import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";

export default async function Home() {
  const session = await auth();

  // Se già autenticato, vai direttamente alla dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-indigo-700 text-center mb-6">
          LibrerIA
        </h1>
        <AuthForm />
      </div>
    </main>
  );
}
