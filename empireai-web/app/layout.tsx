import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const cormorant = localFont({
  src: "./fonts/cormorant-garamond.woff",
  variable: "--font-cormorant",
  weight: "300 700",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/inter.woff",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EmpireAI — Grand King Operating Environment",
  description: "Private executive operating system for the Grand King.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    nosnippet: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
