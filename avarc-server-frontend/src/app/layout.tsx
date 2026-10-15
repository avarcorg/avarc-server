import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "avarc",
  description: "Locations of historical interest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
