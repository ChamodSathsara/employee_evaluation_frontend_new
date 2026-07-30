import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "KPI Evaluate",
  description: "Employee KPI & performance evaluation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full font-sans"
        style={{
          // Distinct, network-independent type system:
          // display face = tight/bold system sans for headings,
          // body face = system sans, data face = system mono for scores.
          ["--font-body" as string]:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif",
          ["--font-display" as string]:
            "'Avenir Next', 'Segoe UI Semibold', -apple-system, BlinkMacSystemFont, Inter, Roboto, sans-serif",
          ["--font-mono-data" as string]:
            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
        }}
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
