'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { IssueCard } from '@/components/IssueCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { AppShell } from '@/components/AppShell';

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

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get('domain') || '';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [domain, setDomain] = useState(initialDomain);
  const [language, setLanguage] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const domains = ['AI', 'DevTools', 'DevOps', 'Fullstack', 'Web3'];
  const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Ruby', 'PHP'];

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '24');
      if (domain) params.set('domain', domain);
      if (language) params.set('language', language);
      if (search) params.set('search', search);
      params.set('sort', sort);

      const response = await fetch(`/api/issues?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch issues');

      const data = await response.json();
      setIssues(data.issues);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, domain, language, search, sort]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchIssues();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchIssues]);

  return (
    <AppShell
      searchPlaceholder="Search repositories..."
      leftPanel={(
        <div className="p-4">
          <FilterSidebar
            domains={domains}
            languages={languages}
            selectedDomain={domain}
            selectedLanguage={language}
            sort={sort}
            onDomainChange={(value) => { setDomain(value); setPage(1); }}
            onLanguageChange={(value) => { setLanguage(value); setPage(1); }}
            onSortChange={(value) => { setSort(value); setPage(1); }}
          />
        </div>
      )}
    >
      <div className="mx-auto max-w-6xl">
        <main className="flex-1 border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <div className="mb-6 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">Issue explorer</p>
                <h1 className="text-3xl font-bold text-black">
                  {domain ? `${domain} Issues` : 'All Issues'}
                </h1>
                <p className="mt-2 text-neutral-500">
                  {loading ? 'Loading...' : `${issues.length} issues found`}
                </p>
              </div>

              <input
                type="text"
                placeholder="Search issues, repos, or companies..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full border-2 border-black bg-[#f8f9fb] px-4 py-3 text-black outline-none transition placeholder:text-neutral-500 md:max-w-xl"
              />
            </div>

            {loading && (
              <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
                <p className="mt-4 text-gray-500">Loading issues...</p>
              </div>
            )}

            {error && (
              <div className="border-2 border-red-400 bg-red-100 p-6 text-center">
                <p className="mb-2 text-red-200">Failed to load issues</p>
                <p className="text-sm text-red-300/70">{error}</p>
              </div>
            )}

            {!loading && !error && issues.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="border-2 border-black px-4 py-2 text-black transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-neutral-600">
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
              </>
            )}

            {!loading && !error && issues.length === 0 && (
              <div className="border-2 border-black bg-[#f8f9fb] p-12 text-center">
                <p className="mb-3 text-xl font-semibold text-black">No issues found</p>
                <p className="text-neutral-500">Try adjusting your filters or run the sync first.</p>
              </div>
            )}
        </main>
      </div>
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black p-8 text-gray-400">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
