import type { Metadata } from "next";
import { Playfair_Display, Lora, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LibrerIA — La tua libreria personale",
  description: "Gestisci la tua libreria personale con ricerca AI, scaffale 3D e statistiche di lettura.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        {/* Applica il tema salvato prima del render per evitare flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var t=localStorage.getItem('theme');
  if(t) document.documentElement.setAttribute('data-theme',t);
  if(t==='custom'){
    try{
      var c=JSON.parse(localStorage.getItem('customTheme')||'{}');
      for(var k in c) document.documentElement.style.setProperty(k,c[k]);
    }catch(e){}
  }
})();`,
          }}
        />
      </head>
      <body className={`${playfair.variable} ${lora.variable} ${inter.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
