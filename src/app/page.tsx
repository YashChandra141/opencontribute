import Link from 'next/link';
import { Suspense } from 'react';
import { IssueCard } from '@/components/IssueCard';
import { Navbar } from '@/components/Navbar';

interface Issue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: string;
  labels: string[];
  author: string;
  commentsCount: number;
  url: string;
  createdAt: string;
  repository: {
    name: string;
    fullName: string;
    language: string | null;
    stars: number;
  };
  company: {
    name: string;
    githubOrg: string;
    domain: string;
  };
}

async function getFeaturedIssues() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/issues?limit=6&sort=popular`, {
      cache: 'no-store',
    });
    if (!res.ok) return { issues: [] };
    return res.json();
  } catch {
    return { issues: [] };
  }
}

export default async function HomePage() {
  const { issues } = await getFeaturedIssues();

  const domains = [
    { name: 'AI', marker: '01', description: 'Agent frameworks, LLM tools, ML platforms' },
    { name: 'DevTools', marker: '02', description: 'Code editors, CLI tools, dev environments' },
    { name: 'DevOps', marker: '03', description: 'CI/CD, monitoring, infrastructure' },
    { name: 'Fullstack', marker: '04', description: 'Web frameworks, backend tools, APIs' },
    { name: 'Web3', marker: '05', description: 'Blockchain, DeFi, smart contracts' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 px-4 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300">
            Curated open-source issues from high-signal startups
          </div>
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
                Discover under-the-radar open source startups.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400 md:text-xl">
                Find meaningful contribution opportunities in active startup projects. Skip saturated repos and focus on issues worth your time.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/explore"
                  className="rounded-lg bg-white px-6 py-3 text-center font-semibold text-black transition hover:bg-gray-200"
                >
                  Explore Issues
                </Link>
                <Link
                  href="/companies"
                  className="rounded-lg border border-white/15 px-6 py-3 text-center font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
                >
                  Browse Companies
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/30">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-sm font-medium text-gray-400">Signal quality</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-black">Live</span>
              </div>
              <div className="space-y-4">
                {[
                  ['Active issues', 'Good first issues and help-wanted labels'],
                  ['Focused repos', '500-20k stars, enough attention without noise'],
                  ['Startup domains', 'AI, DevTools, DevOps, Fullstack, Web3'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="mt-1 text-sm text-gray-500">{copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-zinc-950 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">Domains</p>
              <h2 className="text-3xl font-bold text-white">Explore by focus area</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {domains.map((domain) => (
              <Link
                key={domain.name}
                href={`/explore?domain=${domain.name}`}
                className="group rounded-xl border border-white/10 bg-black p-5 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-zinc-900"
              >
                <div className="mb-5 text-xs font-semibold text-gray-500">{domain.marker}</div>
                <h3 className="mb-2 text-lg font-bold text-white">{domain.name}</h3>
                <p className="text-sm leading-6 text-gray-500 group-hover:text-gray-300">{domain.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-white">Popular Issues</h2>
            <Link href="/explore" className="font-semibold text-gray-300 transition hover:text-white">
              View all
            </Link>
          </div>

          <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading issues...</div>}>
            {issues.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {issues.map((issue: Issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-zinc-950 p-10 text-center text-gray-400">
                <p className="mb-3 text-xl font-semibold text-white">No issues found yet.</p>
                <p>Run the sync to populate the database with issues.</p>
                <code className="mt-5 inline-block rounded-lg border border-white/10 bg-black px-4 py-2 text-gray-300">
                  POST /api/sync
                </code>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-950 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-white">How It Works</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['01', 'We Discover', 'We scan OSSInsight collections and GitHub for active, under-the-radar startups.'],
              ['02', 'We Curate', 'We filter for repo size, issue quality, and contributor-friendly signals.'],
              ['03', 'You Contribute', 'Browse by domain, filter by language, and save promising opportunities.'],
            ].map(([number, title, copy]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-black p-5">
                <div className="mb-4 text-sm font-bold text-gray-500">{number}</div>
                <h3 className="mb-2 font-bold text-white">{title}</h3>
                <p className="text-sm leading-6 text-gray-500">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 py-10 text-gray-500">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-3">
            <span className="font-bold text-white">OpenContribute</span> built for developers who want to make an impact.
          </p>
          <p className="text-sm">Discovering under-the-radar startups across AI, DevTools, DevOps, Fullstack, and Web3.</p>
        </div>
      </footer>
    </div>
  );
}
