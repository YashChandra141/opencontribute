'use client';

import { useState, useEffect } from 'react';
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

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(issue.id));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [issue.id]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    if (isBookmarked) {
      const newBookmarks = bookmarks.filter((id: number) => id !== issue.id);
      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    } else {
      bookmarks.push(issue.id);
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getLabelColor = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('good first') || lower.includes('beginner') || lower.includes('easy')) {
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    }
    if (lower.includes('bug')) return 'border-red-400/30 bg-red-400/10 text-red-200';
    if (lower.includes('feature') || lower.includes('enhancement')) return 'border-blue-400/30 bg-blue-400/10 text-blue-200';
    if (lower.includes('documentation') || lower.includes('docs')) return 'border-violet-400/30 bg-violet-400/10 text-violet-200';
    if (lower.includes('help wanted')) return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    return 'border-white/10 bg-white/5 text-gray-300';
  };

  const domainColors: Record<string, string> = {
    AI: 'border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100',
    DevTools: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
    DevOps: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
    Fullstack: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    Web3: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
  };

  return (
    <article className="group border-2 border-black bg-[#f8f9fb] p-5 shadow-[4px_4px_0_#000] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_#000]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${domainColors[issue.company.domain] || 'border-black bg-white text-black'}`}>
            {issue.company.domain}
          </span>
          <span className="rounded-full border border-black bg-white px-2.5 py-1 text-xs text-black">
            {formatNumber(issue.repository.stars)} stars
          </span>
        </div>
        <button
          onClick={toggleBookmark}
          className={`rounded-lg border px-2.5 py-1 text-sm transition ${
            isBookmarked
              ? 'border-black bg-black text-white'
              : 'border-black text-neutral-600 hover:bg-neutral-100 hover:text-black'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this issue'}
        >
          {isBookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

      <a
        href={issue.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 block line-clamp-2 text-lg font-semibold leading-snug text-black transition hover:underline"
      >
        {issue.title}
      </a>

      <div className="mb-4 flex items-center text-sm text-neutral-600">
        <span className="font-medium text-black">{issue.company.name}</span>
        <span className="mx-2 text-neutral-400">/</span>
        <span>{issue.repository.name}</span>
      </div>

      {issue.labels && issue.labels.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 3).map((label) => (
            <span key={label} className={`rounded-md border px-2 py-0.5 text-xs ${getLabelColor(label)}`}>
              {label}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="px-1 text-xs text-neutral-500">+{issue.labels.length - 3}</span>
          )}
        </div>
      )}

      {issue.repository.language && (
        <div className="mb-4 flex items-center text-xs font-medium text-neutral-700">
          <span className="mr-2 h-2 w-2 rounded-full bg-black"></span>
          {issue.repository.language}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t-2 border-black pt-4 text-xs text-neutral-500">
        <div className="min-w-0">
          <span className="text-black">#{issue.number}</span>
          <span className="mx-2">by</span>
          <span className="truncate">{issue.author}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span>{formatDate(issue.createdAt)}</span>
          {issue.commentsCount > 0 && <span>{issue.commentsCount} comments</span>}
        </div>
      </div>
    </article>
  );
}
