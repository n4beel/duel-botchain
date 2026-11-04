"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "@/components/ui/ConnectButton";
import BuiltOnBotChain from "@/components/botchain/BuiltOnBotChain";
import NetworkBadge from "@/components/botchain/NetworkBadge";
import { footerLinks } from "@/lib/botchain/chain";
import { app } from "@/lib/app-config";

interface PageShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function PageShell({ children, title, description }: PageShellProps) {
  const pathname = usePathname();
  const { site, explorer, contract } = footerLinks();

  const navItems = [
    { href: "/", label: "Duels" },
    { href: "/challenge", label: "Challenge" },
    { href: "/me", label: "My Record" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-base)" }}>
      {/* Header bar */}
      <header
        className="sticky top-0 z-40 border-b-2 px-4 py-3 shadow-md"
        style={{
          borderColor: "var(--accent)",
          background: "var(--bg-surface)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 no-underline group">
              <span
                className="w-3.5 h-3.5 inline-block transition-transform duration-200 group-hover:rotate-90"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="font-heading text-2xl md:text-3xl font-bold tracking-wider uppercase leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                {app.name}
              </span>
            </Link>

            <nav className="flex items-center gap-2" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className="font-heading px-3 py-1 text-sm md:text-base font-semibold tracking-wide uppercase transition-colors"
                    style={{
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "var(--accent-ink)" : "var(--text-secondary)",
                      border: isActive ? "1px solid var(--accent)" : "1px solid transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NetworkBadge />
            <div className="w-[140px] md:w-[170px]">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8">
        {(title || description) && (
          <div className="mb-6 border-b-2 pb-3" style={{ borderColor: "var(--accent)" }}>
            {title && (
              <h1
                className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </main>

      {/* Footer bar */}
      <footer
        className="border-t-2 py-6 mt-12 text-xs"
        style={{
          borderColor: "var(--accent)",
          background: "var(--bg-surface)",
          color: "var(--text-muted)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <div className="font-heading text-base font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              {app.name} · Split Lanes
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {app.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 inline-block" style={{ background: "var(--accent)" }} />
              <BuiltOnBotChain
                className="font-semibold uppercase tracking-wider text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              />
            </span>

            {contract && (
              <a
                href={contract}
                target="_blank"
                rel="noreferrer"
                className="hover:underline font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Contract
              </a>
            )}

            <a
              href={site}
              target="_blank"
              rel="noreferrer"
              className="hover:underline font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              botchain.ai
            </a>

            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="hover:underline font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              BOT Chain Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
