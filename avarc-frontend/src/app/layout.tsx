import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "avArc",
  description: "avArc frontend built with Next.js"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
