"use client";

import { useState } from "react";
import { Link, usePathname } from "../i18n/navigation";

export type NavItem = { href: string; label: string };

const itemClass =
  "block rounded-md px-3 py-2 text-sm font-medium transition hover:bg-hover " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// The navigation of the top bar: inline from a tablet up, behind a menu
// button on a phone.
export function NavMenu({
  items,
  label,
  menuLabel,
}: {
  items: NavItem[];
  label: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen(!open)}
        className={`${itemClass} md:hidden`}
      >
        {menuLabel}
      </button>
      <ul
        id="main-menu"
        className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-line bg-surface p-2 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`${itemClass} aria-[current=page]:text-accent`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
