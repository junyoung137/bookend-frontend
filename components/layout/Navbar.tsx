"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, PenLine, BarChart2, User } from "lucide-react";

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const navItems = [
    { href: "/", icon: <Home className="w-4 h-4" />, label: t("nav.home") },
    {
      href: "/editor",
      icon: <PenLine className="w-4 h-4" />,
      label: t("nav.editor"),
    },
    {
      href: "/dashboard",
      icon: <BarChart2 className="w-4 h-4" />,
      label: t("nav.dashboard"),
    },
    {
      href: "/profile",
      icon: <User className="w-4 h-4" />,
      label: t("nav.profile"),
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white/70 backdrop-blur border-b border-gray-200 z-[1000] flex items-center justify-between px-6">
      {/* 로고 */}
      <Link href="/" className="font-semibold text-gray-800 text-lg">
        Bookend
      </Link>

      {/* 네비게이션 메뉴 */}
      <ul className="flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  relative flex items-center gap-2 text-sm font-medium
                  transition-colors
                  ${isActive ? "text-moss" : "text-gray-600 hover:text-gray-800"}
                `}
              >
                {item.icon}
                {item.label}

                {/* underline 애니메이션 */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-moss rounded"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* CTA 버튼 */}
      <Link
        href="/editor"
        className="
          px-4 py-1.5 rounded-lg bg-moss text-white text-sm font-semibold
          hover:bg-moss/90 transition-colors shadow-sm
        "
      >
        {t("nav.startWriting")}
      </Link>
    </nav>
  );
}
