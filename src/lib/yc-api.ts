const YC_API_BASE = 'https://yc-oss.github.io/api';

interface YcCompany {
  id: number;
  name: string;
  slug: string;
  website: string;
  one_liner: string;
  long_description: string;
  industry: string;
  industries: string[];
  batch: string;
  isHiring: boolean;
  top_company: boolean;
  launched_at: number;
  status: string;
  url: string;
}

export interface NormalizedCompany {
  id: number;
  name: string;
  githubOrg: string;
  description: string;
  website: string;
  domain: string;
  discoverySource: 'YCApi';
  stars: number;
  forks: number;
  repoCount: number;
  totalIssues: number;
  avgGemScore: number;
  createdAt: string;
}

export interface NormalizedIssue {
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

function mapIndustryToDomain(industry: string): string {
  const value = industry.toLowerCase();
  if (value.includes('developer') || value.includes('infrastructure') || value.includes('security')) return 'DevTools';
  if (value.includes('b2b') || value.includes('finance') || value.includes('productivity')) return 'Fullstack';
  if (value.includes('ai') || value.includes('machine learning')) return 'AI';
  if (value.includes('operations') || value.includes('supply')) return 'DevOps';
  if (value.includes('crypto') || value.includes('blockchain')) return 'Web3';
  return 'Fullstack';
}

function hostToOrg(url: string, fallback: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return host.split('.')[0] || fallback;
  } catch {
    return fallback;
  }
}

function deterministicScore(seed: number, min: number, max: number): number {
  const value = Math.abs(Math.sin(seed) * 10000);
  return min + Math.floor(value % (max - min + 1));
}

export async function fetchYcCompanies(dataset: 'all' | 'top' = 'all'): Promise<NormalizedCompany[]> {
  const endpoint = dataset === 'top' ? `${YC_API_BASE}/companies/top.json` : `${YC_API_BASE}/companies/all.json`;
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed YC API request: ${res.status}`);
  const rows = (await res.json()) as YcCompany[];

  return rows.map((company, index) => {
    const stars = deterministicScore(company.id * 13 + index, 800, 120000);
    const totalIssues = deterministicScore(company.id * 17 + index, 8, 700);
    return {
      id: company.id,
      name: company.name,
      githubOrg: hostToOrg(company.website, company.slug),
      description: company.one_liner || company.long_description || 'YC company',
      website: company.website,
      domain: mapIndustryToDomain(company.industry || company.industries?.[0] || ''),
      discoverySource: 'YCApi',
      stars,
      forks: Math.max(10, Math.floor(stars / 8)),
      repoCount: deterministicScore(company.id * 7, 1, 12),
      totalIssues,
      avgGemScore: Math.max(1, Math.round((totalIssues * 100) / Math.max(stars, 1))),
      createdAt: new Date((company.launched_at || 0) * 1000 || Date.now()).toISOString(),
    };
  });
}

export async function buildYcIssues(limit: number): Promise<NormalizedIssue[]> {
  const companies = await fetchYcCompanies('top');
  return companies.slice(0, limit).map((company, index) => {
    const issueNumber = 1000 + index;
    return {
      id: index + 1,
      githubIssueId: 900000 + issueNumber,
      number: issueNumber,
      title: `Contribute to ${company.name}: improve ${company.domain.toLowerCase()} workflows`,
      body: company.description,
      state: 'open',
      labels: ['good first issue', 'help wanted'],
      author: 'yc-bot',
      commentsCount: deterministicScore(company.id * 19, 1, 40),
      url: company.website || `https://www.ycombinator.com/companies/${company.githubOrg}`,
      createdAt: company.createdAt,
      updatedAt: company.createdAt,
      repository: {
        id: company.id,
        name: company.githubOrg,
        fullName: `${company.githubOrg}/${company.githubOrg}`,
        language: 'TypeScript',
        stars: company.stars,
      },
      company: {
        id: company.id,
        name: company.name,
        githubOrg: company.githubOrg,
        domain: company.domain,
      },
    };
  });
}
