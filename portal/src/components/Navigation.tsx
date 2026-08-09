"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calculator, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/estimator", label: "Property Estimator", icon: Calculator },
  { href: "/analysis", label: "Market Analysis", icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-700">
            <Home className="h-6 w-6" />
            <span>HSBC Property Portal</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
