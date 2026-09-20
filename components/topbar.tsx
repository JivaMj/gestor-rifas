"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export function TopBar({ isAdmin, isLoggedIn }: TopBarProps) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/dashboard") ||
    pathname.match(/^\/manage\/[^/]+/) ||
    pathname.match(/^\/promo-manage\/[^/]+/) ||
    pathname.startsWith("/fiado/")
  ) {
    return null;
  }

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/rifas", label: "Rifas" },
    { href: "/fiados", label: "Actividades" },
    { href: "/promos", label: "Promociones" },
  ];

  if (isLoggedIn) {
    links.push({ href: "/dashboard", label: "Mi panel" });
  }

  if (isAdmin) {
    links.push({ href: "/admin/rifas", label: "Admin" });
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="font-extrabold text-gray-900 text-sm hidden sm:block">
            Gestor de Rifas
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-amber-100 text-amber-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Iniciar sesion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
