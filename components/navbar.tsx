"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  isDark: boolean;
  isLoggedIn: boolean;
  user?: {
    firstName?: string;
    displayName?: string | null;
  } | null;
}

export function Navbar({ isDark, isLoggedIn, user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkClass = `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
    isDark
      ? "text-white/70 hover:text-white hover:bg-white/5"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4">
      <div
        className={`mx-auto max-w-7xl rounded-2xl border backdrop-blur-xl shadow-lg transition-all ${
          isDark
            ? "border-white/10 bg-[#130927]/85"
            : "border-slate-200 bg-white/85"
        }`}
      >
        <div className="flex items-center h-16 px-5 lg:px-6 gap-4">
          {/* Logo + Name */}
          <Link
            href="/"
            className="flex items-center gap-3 flex-shrink-0 group"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/images/zeroup-partners-logo-dark-mode.png"
                alt="ZeroUp Partners"
                fill
                className={`object-contain ${isDark ? "block" : "hidden"}`}
                priority
              />
              <Image
                src="/images/zeroup-partners-logo-light-mode.png"
                alt="ZeroUp Partners"
                fill
                className={`object-contain ${isDark ? "hidden" : "block"}`}
                priority
              />
            </div>

            <span
              className={`text-base font-bold hidden sm:block transition-colors ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              ZeroUp Partners
            </span>
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link href="/projects" className={navLinkClass}>
              Projects
            </Link>

            <Link href="/community" className={navLinkClass}>
              Community
            </Link>

            {isLoggedIn && (
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <ThemeToggle />

            {isLoggedIn ? (
              <Link href="/dashboard/profile">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#a05cd4] to-[#7030b0] flex items-center justify-center text-white text-sm font-semibold ring-2 transition-all ${
                    isDark
                      ? "ring-white/20 hover:ring-white/40"
                      : "ring-[#7030b0]/30 hover:ring-[#7030b0]/50"
                  }`}
                >
                  {user?.firstName?.[0] || user?.displayName?.[0] || "U"}
                </div>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-full px-5 ${
                      isDark
                        ? "text-white/70 hover:text-white hover:bg-white/5"
                        : ""
                    }`}
                  >
                    Login
                  </Button>
                </Link>

                <Link href="/signup">
                  <Button
                    size="sm"
                    className="rounded-full px-5 bg-gradient-to-r from-[#8d44d1] to-[#7030b0] hover:from-[#7030b0] hover:to-[#5e269a] text-white border-0 shadow-md shadow-[#8d44d1]/20"
                  >
                    Become a Partner
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <ThemeToggle />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "text-white/70 hover:text-white hover:bg-white/5"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className={`md:hidden border-t rounded-b-2xl ${
              isDark
                ? "border-white/10 bg-[#130927]"
                : "border-slate-200 bg-white"
            }`}
          >
            <nav className="flex flex-col p-3 gap-1">
              <Link
                href="/projects"
                className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isDark
                    ? "text-white/80 hover:text-white hover:bg-white/5"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>

              <Link
                href="/community"
                className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isDark
                    ? "text-white/80 hover:text-white hover:bg-white/5"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      isDark
                        ? "text-white/80 hover:text-white hover:bg-white/5"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/profile"
                    className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      isDark
                        ? "text-white/80 hover:text-white hover:bg-white/5"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      isDark
                        ? "text-white/80 hover:text-white hover:bg-white/5"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isDark
                        ? "text-[#a05cd4] hover:text-[#c084f5] hover:bg-[#8d44d1]/10"
                        : "text-[#7030b0] hover:text-[#5e1a94] hover:bg-[#f5ecff]"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Become a Partner
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
