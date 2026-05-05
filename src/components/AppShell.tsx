'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  searchPlaceholder?: string;
}

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/explore', label: 'Explorer' },
  { href: '/companies', label: 'Organizations' },
  { href: '/bounties', label: 'Bounties' },
];

export function AppShell({ children, leftPanel, searchPlaceholder = 'Search projects...' }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] text-[#191c1e]">
      <aside className="hidden w-64 shrink-0 border-r-2 border-black bg-white md:flex md:flex-col">
        <div className="border-b-2 border-black p-4">
          <h2 className="text-xl font-bold tracking-tight">OSS Contributor</h2>
          <p className="text-xs font-semibold text-neutral-500">v1.0.4-stable</p>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block border-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? 'border-black bg-black text-white shadow-[3px_3px_0_#000]'
                    : 'border-transparent hover:border-black hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t-2 border-black p-4">
          <button className="w-full border-2 border-black bg-black px-3 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[3px_3px_0_#000] transition hover:translate-x-px hover:translate-y-px hover:shadow-none">
            Post Bounty
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-black bg-white px-4">
          <div className="text-lg font-bold tracking-tight md:hidden">DevFlow</div>
          <input
            className="hidden h-9 w-72 border-2 border-black bg-[#f8f9fb] px-3 text-sm font-medium outline-none md:block"
            placeholder={searchPlaceholder}
          />
          <button className="border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_#000] transition hover:translate-x-px hover:translate-y-px hover:shadow-none">
            Connect GitHub
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {leftPanel && <aside className="hidden w-72 shrink-0 border-r-2 border-black bg-[#f3f4f6] xl:block">{leftPanel}</aside>}
          <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
