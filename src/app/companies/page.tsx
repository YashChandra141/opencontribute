'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

interface Company {
  id: number;
  name: string;
  githubOrg: string;
  description: string;
  website: string;
  domain: string;
  stars: number;
  forks: number;
  repoCount: number;
  totalIssues: number;
  avgGemScore: number;
  createdAt: string;
}

export default function CompaniesPage() {
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
  }, [page, domain, sort]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCompanies();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchCompanies]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">Company directory</p>
          <h1 className="mb-2 text-3xl font-bold text-white">Under-the-Radar Startups</h1>
          <p className="max-w-2xl text-gray-400">
            Discover open-source companies with active communities and meaningful contribution opportunities.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Domain</label>
            <select
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setPage(1); }}
              className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Sort By</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
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

        {!loading && !error && companies.length > 0 && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-zinc-900"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{company.name}</h3>
                      <a
                        href={`https://github.com/${company.githubOrg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 transition hover:text-white"
                      >
                        @{company.githubOrg}
                      </a>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-200">
                      {company.domain}
                    </span>
                  </div>

                  <p className="mb-4 line-clamp-2 text-gray-400">
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
                      <div className="font-bold text-white">{company.stars.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Stars</div>
                    </div>
                    <div>
                      <div className="font-bold text-white">{company.repoCount}</div>
                      <div className="text-xs text-gray-500">Repos</div>
                    </div>
                    <div>
                      <div className="font-bold text-white">{company.totalIssues.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Open Issues</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/explore?company=${company.id}`}
                      className="flex-1 rounded-lg bg-white py-2 text-center text-sm font-semibold text-black transition hover:bg-gray-200"
                    >
                      View Issues
                    </Link>
                    <a
                      href={`https://github.com/${company.githubOrg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 px-4 py-2 text-gray-300 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-white/10 px-4 py-2 text-gray-300 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}

        {!loading && !error && companies.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-12 text-center">
            <p className="mb-3 text-xl font-semibold text-white">No companies found</p>
            <p className="text-gray-500">Run the sync to populate the database with companies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
