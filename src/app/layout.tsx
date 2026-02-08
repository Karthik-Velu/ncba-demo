import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "NCBA - NBFI Assessment Platform",
  description: "Risk Infrastructure Platform for NBFI Financial Statement Assessment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
