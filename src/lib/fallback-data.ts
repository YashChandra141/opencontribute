export interface FallbackCompany {
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

export interface FallbackIssue {
  id: number;
  githubIssueId: number;
  number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  author: string;
  commentsCount: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  repository: {
    id: number;
    name: string;
    fullName: string;
    language: string;
    stars: number;
  };
  company: {
    id: number;
    name: string;
    githubOrg: string;
    domain: string;
  };
}

const now = new Date().toISOString();

export const fallbackCompanies: FallbackCompany[] = [
  {
    id: 1,
    name: 'Supabase',
    githubOrg: 'supabase',
    description: 'Open source Firebase alternative with a strong developer ecosystem.',
    website: 'https://supabase.com',
    domain: 'Fullstack',
    discoverySource: 'YCGitHub',
    stars: 72000,
    forks: 6400,
    repoCount: 12,
    totalIssues: 329,
    avgGemScore: 84,
    createdAt: now,
  },
  {
    id: 2,
    name: 'PostHog',
    githubOrg: 'posthog',
    description: 'Product analytics platform with a highly active open-source codebase.',
    website: 'https://posthog.com',
    domain: 'DevTools',
    discoverySource: 'YCGitHub',
    stars: 23000,
    forks: 1500,
    repoCount: 9,
    totalIssues: 141,
    avgGemScore: 79,
    createdAt: now,
  },
  {
    id: 3,
    name: 'Cal.com',
    githubOrg: 'calcom',
    description: 'Scheduling infrastructure platform with meaningful first-time issues.',
    website: 'https://cal.com',
    domain: 'Fullstack',
    discoverySource: 'YCGitHub',
    stars: 34000,
    forks: 8500,
    repoCount: 6,
    totalIssues: 207,
    avgGemScore: 82,
    createdAt: now,
  },
  {
    id: 4,
    name: 'Dub.co',
    githubOrg: 'dubinc',
    description: 'Open-source link management tools for modern growth teams.',
    website: 'https://dub.co',
    domain: 'DevTools',
    discoverySource: 'YCGitHub',
    stars: 21000,
    forks: 1700,
    repoCount: 4,
    totalIssues: 63,
    avgGemScore: 75,
    createdAt: now,
  },
];

export const fallbackIssues: FallbackIssue[] = [
  {
    id: 101,
    githubIssueId: 900101,
    number: 4592,
    title: 'Implement parallel processing for data ingestion pipeline',
    body: 'Speed up ingestion by batching and concurrent workers.',
    state: 'open',
    labels: ['good first issue', 'help wanted'],
    author: 'devhelper',
    commentsCount: 14,
    url: 'https://github.com/open-telemetry/opentelemetry-collector/issues/4592',
    createdAt: now,
    updatedAt: now,
    repository: {
      id: 201,
      name: 'opentelemetry-collector',
      fullName: 'open-telemetry/opentelemetry-collector',
      language: 'Go',
      stars: 6200,
    },
    company: {
      id: 11,
      name: 'OpenTelemetry',
      githubOrg: 'open-telemetry',
      domain: 'DevOps',
    },
  },
  {
    id: 102,
    githubIssueId: 900102,
    number: 8921,
    title: 'Fix memory leak in WebSocket connection handler',
    body: 'Connection lifecycle leaks handlers over long sessions.',
    state: 'open',
    labels: ['bug', 'typescript'],
    author: 'maintainer',
    commentsCount: 11,
    url: 'https://github.com/vercel/next.js/issues/8921',
    createdAt: now,
    updatedAt: now,
    repository: {
      id: 202,
      name: 'next.js',
      fullName: 'vercel/next.js',
      language: 'TypeScript',
      stars: 128000,
    },
    company: {
      id: 12,
      name: 'Vercel',
      githubOrg: 'vercel',
      domain: 'Fullstack',
    },
  },
  {
    id: 103,
    githubIssueId: 900103,
    number: 1103,
    title: 'Create benchmark suite for crypto primitives',
    body: 'Need repeatable benches across platforms and compilers.',
    state: 'open',
    labels: ['help wanted', 'performance'],
    author: 'rustacean',
    commentsCount: 9,
    url: 'https://github.com/rust-lang/rust/issues/1103',
    createdAt: now,
    updatedAt: now,
    repository: {
      id: 203,
      name: 'rust',
      fullName: 'rust-lang/rust',
      language: 'Rust',
      stars: 98000,
    },
    company: {
      id: 13,
      name: 'Rust Foundation',
      githubOrg: 'rust-lang',
      domain: 'DevTools',
    },
  },
];
