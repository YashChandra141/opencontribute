import Link from 'next/link';
import { Suspense } from 'react';
import { IssueCard } from '@/components/IssueCard';
import { AppShell } from '@/components/AppShell';
import { formatNumber } from '@/lib/format';

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

interface Company {
  id: number;
  name: string;
  githubOrg: string;
  description: string;
  website: string;
  domain: string;
  discoverySource: string;
  stars: number;
  repoCount: number;
  totalIssues: number;
}

interface Bounty {
  id: string;
  title: string;
  repo: string;
  stack: string[];
  expiresIn: string;
  reward: string;
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

async function getFeaturedCompanies() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/companies?limit=4&sort=stars`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { companies: [] };
    return res.json();
  } catch {
    return { companies: [] };
  }
}

export default async function HomePage() {
  const { issues } = await getFeaturedIssues();
  const { companies } = await getFeaturedCompanies();
  const ycCompanies: Company[] =
    companies.filter((company: Company) => company.discoverySource === 'YCGitHub').length > 0
      ? companies.filter((company: Company) => company.discoverySource === 'YCGitHub')
      : companies;
  const bounties: Bounty[] = [
    {
      id: '#4592',
      title: 'Implement parallel processing for data ingestion pipeline',
      repo: 'open-telemetry/opentelemetry-collector',
      stack: ['Go', 'Docker'],
      expiresIn: '12h',
      reward: '$1,200',
    },
    {
      id: '#8921',
      title: 'Fix memory leak in WebSocket connection handler',
      repo: 'vercel/next.js',
      stack: ['TypeScript', 'React'],
      expiresIn: '3d',
      reward: '$850',
    },
    {
      id: '#1103',
      title: 'Create comprehensive benchmark suite for crypto primitives',
      repo: 'rust-lang/rust',
      stack: ['Rust'],
      expiresIn: '14d',
      reward: '$500',
    },
  ];

  const domains = [
    { name: 'AI', marker: '01', description: 'Agent frameworks, LLM tools, ML platforms' },
    { name: 'DevTools', marker: '02', description: 'Code editors, CLI tools, dev environments' },
    { name: 'DevOps', marker: '03', description: 'CI/CD, monitoring, infrastructure' },
    { name: 'Fullstack', marker: '04', description: 'Web frameworks, backend tools, APIs' },
    { name: 'Web3', marker: '05', description: 'Blockchain, DeFi, smart contracts' },
  ];

  return (
    <AppShell searchPlaceholder="Search projects...">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="border-2 border-black bg-white p-6 shadow-[8px_8px_0_#000]">
          <p className="mb-3 inline-block border-2 border-black bg-black px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Trending Today
          </p>
          <h1 className="mb-3 text-5xl font-bold leading-tight tracking-tight">Next.js Framework</h1>
          <p className="max-w-3xl text-sm font-medium text-neutral-700">
            Discover under-the-radar open-source startups and contribute to active repositories with high-signal issues.
          </p>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2">
              <h2 className="text-2xl font-bold">Featured YC Startups</h2>
              <Link href="/companies?view=yc" className="border-2 border-black px-2 py-1 text-xs font-bold uppercase">
                View all
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ycCompanies.slice(0, 4).map((company: Company) => (
                <div key={company.id} className="border-2 border-black bg-[#f3f4f6] p-4 shadow-[3px_3px_0_#000]">
                  <Link href="/companies?view=yc" className="block">
                    <h3 className="text-xl font-bold">{company.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-neutral-600">@{company.githubOrg}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-neutral-700">{company.description || 'Open-source startup.'}</p>
                    <div className="mt-3 flex gap-2 text-xs font-bold">
                      <span className="border-2 border-black px-2 py-1">{formatNumber(company.stars)} stars</span>
                      <span className="border-2 border-black px-2 py-1">{company.domain}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="border-2 border-black bg-white p-4 shadow-[6px_6px_0_#000]">
              <h3 className="mb-3 text-xl font-bold">Latest Bounties</h3>
              <div className="space-y-2">
                {bounties.map((bounty) => (
                  <div key={bounty.id} className="border-2 border-black bg-[#f8f9fb] p-3">
                    <p className="line-clamp-1 text-sm font-bold">{bounty.title}</p>
                    <p className="text-xs text-neutral-600">{bounty.repo}</p>
                    <p className="mt-1 text-xs font-bold">{bounty.reward}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-2 border-black bg-white p-4 shadow-[6px_6px_0_#000]">
              <h3 className="mb-3 text-xl font-bold">Live Issues</h3>
              <div className="space-y-2">
                {issues.slice(0, 4).map((issue: Issue) => (
                  <a key={issue.id} href={issue.url} target="_blank" rel="noreferrer" className="block border-2 border-black bg-[#f8f9fb] p-3">
                    <p className="line-clamp-1 text-sm font-bold">{issue.title}</p>
                    <p className="text-xs text-neutral-600">{issue.repository.fullName}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Popular Issues</h2>
            <Link href="/explore" className="border-2 border-black px-2 py-1 text-xs font-bold uppercase">
              View all
            </Link>
          </div>
          <Suspense fallback={<div className="py-8 text-sm text-neutral-500">Loading...</div>}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {issues.map((issue: Issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </Suspense>
        </section>
      </div>
    </AppShell>
  );
}
