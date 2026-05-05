'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { formatNumber } from '@/lib/format';

interface Company {
  id: number;
  name: string;
  githubOrg: string;
  description: string;
  website: string;
  domain: string;
  discoverySource: string;
  stars: number;
  forks: number;
  repoCount: number;
  totalIssues: number;
  avgGemScore: number;
  createdAt: string;
}

function CompaniesContent() {
  const searchParams = useSearchParams();
  const isYcView = searchParams.get('view') === 'yc';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [sort, setSort] = useState('stars');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const domains = ['AI', 'DevTools', 'DevOps', 'Fullstack', 'Web3'];
  const sortOptions = [
    { value: 'stars', label: 'Most Stars' },
    { value: 'issues', label: 'Most Issues' },
    { value: 'name', label: 'Name' },
  ];

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (domain) params.set('domain', domain);
      if (isYcView) params.set('source', 'YCGitHub');
      params.set('sort', sort);

      const response = await fetch(`/api/companies?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch companies');

      const data = await response.json();
      setCompanies(data.companies);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, domain, sort, isYcView]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCompanies();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchCompanies]);
  const ycCompanies = companies.filter((company) => company.discoverySource === 'YCGitHub');
  const visibleCompanies = isYcView ? (ycCompanies.length > 0 ? ycCompanies : companies.slice(0, 8)) : companies;

  return (
    <AppShell searchPlaceholder="Search companies...">
      <div className="mx-auto max-w-6xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_#000]">
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
            {isYcView ? 'YC companies' : 'Company directory'}
          </p>
          <h1 className="mb-2 text-3xl font-bold text-black">
            {isYcView ? 'Featured YC Startups' : 'Under-the-Radar Startups'}
          </h1>
          <p className="max-w-2xl text-neutral-600">
            {isYcView
              ? 'A YC-focused list of open-source startups with active repos and contributor-friendly issues.'
              : 'Discover open-source companies with active communities and meaningful contribution opportunities.'}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 border-2 border-black bg-[#f8f9fb] p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Domain</label>
            <select
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setPage(1); }}
              className="border-2 border-black bg-white px-3 py-2 text-sm text-black outline-none transition"
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Sort By</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="border-2 border-black bg-white px-3 py-2 text-sm text-black outline-none transition"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
            <p className="mt-4 text-gray-500">Loading companies...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-6 text-center">
            <p className="mb-2 text-red-200">Failed to load companies</p>
            <p className="text-sm text-red-300/70">{error}</p>
          </div>
        )}

        {!loading && !error && visibleCompanies.length > 0 && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {visibleCompanies.map((company) => (
                <div key={company.id} className="border-2 border-black bg-[#f8f9fb] p-6 shadow-[4px_4px_0_#000]">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-black">{company.name}</h3>
                      <a
                        href={`https://github.com/${company.githubOrg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-500 transition hover:text-black"
                      >
                        @{company.githubOrg}
                      </a>
                    </div>
                    <span className="border-2 border-black bg-white px-2.5 py-1 text-xs font-semibold text-black">
                      {company.domain}
                    </span>
                  </div>

                  <p className="mb-4 line-clamp-2 text-neutral-600">
                    {company.description || 'No description available'}
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {company.avgGemScore > 0 && (
                      <span className="rounded-full border border-white/20 bg-white px-2.5 py-1 text-xs font-bold text-black">
                        Gem Score {company.avgGemScore}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4 text-center">
                    <div>
                      <div className="font-bold text-black">{formatNumber(company.stars)}</div>
                      <div className="text-xs text-neutral-500">Stars</div>
                    </div>
                    <div>
                      <div className="font-bold text-black">{company.repoCount}</div>
                      <div className="text-xs text-neutral-500">Repos</div>
                    </div>
                    <div>
                      <div className="font-bold text-black">{formatNumber(company.totalIssues)}</div>
                      <div className="text-xs text-neutral-500">Open Issues</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/explore?company=${company.id}`}
                      className="flex-1 border-2 border-black bg-black py-2 text-center text-sm font-semibold text-white transition"
                    >
                      View Issues
                    </Link>
                    <a
                      href={`https://github.com/${company.githubOrg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-2 border-black px-4 py-2 text-sm text-black transition"
                    >
                      GitHub
                    </a>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      className="border-2 border-black px-4 py-2 text-sm text-black transition"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isYcView && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                className="border-2 border-black px-4 py-2 text-black transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="border-2 border-black px-4 py-2 text-black transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && visibleCompanies.length === 0 && (
          <div className="border-2 border-black bg-[#f8f9fb] p-12 text-center">
            <p className="mb-3 text-xl font-semibold text-black">No companies found</p>
            <p className="text-neutral-500">Run the sync to populate the database with companies.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black p-8 text-gray-400">Loading...</div>}>
      <CompaniesContent />
    </Suspense>
  );
}
