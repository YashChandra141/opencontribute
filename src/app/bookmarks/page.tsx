'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { IssueCard } from '@/components/IssueCard';

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
  updatedAt: string;
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

export default function BookmarksPage() {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem('bookmarks');
      if (stored) {
        setBookmarkedIds(JSON.parse(stored));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchBookmarkedIssues = async () => {
      if (bookmarkedIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/issues?limit=1000');
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        const bookmarked = data.issues.filter((issue: Issue) =>
          bookmarkedIds.includes(issue.id)
        );
        setIssues(bookmarked);
      } catch (error) {
        console.error('Error fetching bookmarked issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedIssues();
  }, [bookmarkedIds]);

  const clearBookmarks = () => {
    localStorage.removeItem('bookmarks');
    setBookmarkedIds([]);
    setIssues([]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">Saved work</p>
            <h1 className="mb-2 text-3xl font-bold text-white">Your Bookmarks</h1>
            <p className="text-gray-400">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {issues.length > 0 && (
            <button
              onClick={clearBookmarks}
              className="rounded-lg border border-red-400/30 px-4 py-2 text-red-200 transition hover:bg-red-400/10"
            >
              Clear All
            </button>
          )}
        </div>

        {loading && (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
            <p className="mt-4 text-gray-500">Loading bookmarks...</p>
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-12 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white text-lg font-black text-black">
              OC
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">No bookmarks yet</h2>
            <p className="mx-auto mb-6 max-w-md text-gray-500">
              Browse issues and save interesting contribution opportunities for later.
            </p>
            <Link
              href="/explore"
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
            >
              Start Exploring
            </Link>
          </div>
        )}

        {!loading && issues.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
