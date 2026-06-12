import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Static title — no template, so all pages show only "Mashhii"
  title: "Mashhii",
  description: "Your personal operating system",
  // favicon served from public/favicon.ico via explicit link tag
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Restore accent color + background theme before first paint to avoid flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var c=localStorage.getItem('mashhii-accent');if(c&&c!=='purple')document.documentElement.setAttribute('data-color',c);var bg=localStorage.getItem('mashhii-bg');if(bg&&bg!=='default')document.documentElement.setAttribute('data-bg',bg);}catch(e){}` }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
          </SessionProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--card-foreground))",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
