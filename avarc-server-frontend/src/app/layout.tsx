import type { ReactNode } from "react";

export const metadata = {
  title: "avarc",
  description: "Locations of historical interest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
