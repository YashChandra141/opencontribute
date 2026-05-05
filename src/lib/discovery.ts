// Discovery Engine: GitHub YC-focused discovery
// Finds YC startups/companies with active open-source repos

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OSSINSIGHT_URL = process.env.OSSINSIGHT_BASE_URL || 'https://api.ossinsight.io/v1';

// Priority domains with their OSSInsight collection IDs
const DOMAIN_COLLECTIONS: Record<string, number[]> = {
  AI: [10010, 10076, 10098, 10106, 10112],
  DevTools: [10087, 10047, 10015, 10064],
  DevOps: [10020, 10054, 10053, 10063],
  Fullstack: [10004, 10005, 10019, 10090],
  Web3: [10031],
};

interface DiscoveredRepo {
  githubOrg: string;
  name: string;
  description: string | null;
  website: string | null;
  domain: string;
  discoverySource: 'YCGitHub' | 'OSSInsight';
  stars: number;
  forks: number;
  fullName: string;
  language: string | null;
  openIssuesCount: number;
  repoId: number;
}

function classifyDomain(topics: string[], language: string | null): string {
  const tags = topics.map((topic) => topic.toLowerCase());
  const lang = (language || '').toLowerCase();

  if (tags.some((tag) => ['ai', 'llm', 'machine-learning', 'ml', 'gpt'].includes(tag))) return 'AI';
  if (tags.some((tag) => ['devops', 'kubernetes', 'observability', 'ci-cd', 'infrastructure'].includes(tag))) return 'DevOps';
  if (tags.some((tag) => ['web3', 'blockchain', 'crypto', 'defi'].includes(tag))) return 'Web3';
  if (tags.some((tag) => ['developer-tools', 'devtools', 'cli', 'tooling'].includes(tag))) return 'DevTools';
  if (['typescript', 'javascript', 'python', 'go', 'rust'].includes(lang)) return 'Fullstack';
  return 'DevTools';
}

// Fetch from OSSInsight collections
async function fetchFromOSSInsight(): Promise<DiscoveredRepo[]> {
  const repos: DiscoveredRepo[] = [];

  for (const [domain, collectionIds] of Object.entries(DOMAIN_COLLECTIONS)) {
    for (const collectionId of collectionIds) {
      try {
        const response = await fetch(`${OSSINSIGHT_URL}/collections/${collectionId}/repos`);
        if (!response.ok) continue;

        const data = await response.json();
        if (!data.data?.rows) continue;

        for (const row of data.data.rows) {
          const stars = parseInt(row.stars) || 0;
          if (stars < 150 || stars > 100000) continue;

          const [owner, repo] = row.repo_name.split('/');
          if (!owner || !repo) continue;

          repos.push({
            githubOrg: owner,
            name: owner,
            description: row.description || null,
            website: null,
            domain,
            discoverySource: 'OSSInsight',
            stars,
            forks: parseInt(row.forks) || 0,
            fullName: row.repo_name,
            language: row.primary_language || null,
            openIssuesCount: 0,
            repoId: parseInt(row.repo_id) || 0,
          });
        }
      } catch (error) {
        console.error(`OSSInsight error for collection ${collectionId}:`, error);
      }
    }
  }

  return repos;
}

// Fetch YC-tagged or YC-described repositories from GitHub
async function fetchFromYcGitHub(): Promise<DiscoveredRepo[]> {
  const repos: DiscoveredRepo[] = [];
  const ycQueries = [
    'topic:y-combinator topic:open-source stars:150..100000 pushed:>2024-01-01 archived:false',
    'ycombinator in:description topic:open-source stars:150..100000 pushed:>2024-01-01 archived:false',
    'topic:y-combinator stars:150..100000 pushed:>2024-01-01 archived:false',
  ];

  for (const query of ycQueries) {
    try {
      const response = await octokit.rest.search.repos({
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 30,
      });

      for (const repo of response.data.items || []) {
        if (repo.stargazers_count < 150) continue;
        const [owner] = repo.full_name.split('/');
        const topics = repo.topics || [];

        repos.push({
          githubOrg: owner,
          name: owner,
          description: repo.description,
          website: repo.homepage,
          domain: classifyDomain(topics, repo.language),
          discoverySource: 'YCGitHub',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          fullName: repo.full_name,
          language: repo.language,
          openIssuesCount: repo.open_issues_count,
          repoId: repo.id,
        });
      }
    } catch (error) {
      console.error('YC GitHub search error:', error);
    }
  }

  return repos;
}

// Deduplicate repos by githubOrg
function deduplicateRepos(repos: DiscoveredRepo[]): DiscoveredRepo[] {
  const seen = new Map<string, DiscoveredRepo>();
  
  for (const repo of repos) {
    const existing = seen.get(repo.githubOrg);
    
    if (!existing || repo.stars > existing.stars) {
      seen.set(repo.githubOrg, repo);
    }
  }
  
  return Array.from(seen.values());
}

// Main discovery function
export async function discoverStartups(limit: number = 50): Promise<DiscoveredRepo[]> {
  console.log('Starting discovery...');
  
  const [ycRepos, ossInsightRepos] = await Promise.all([fetchFromYcGitHub(), fetchFromOSSInsight()]);
  
  console.log(`YC GitHub: ${ycRepos.length} repos`);
  console.log(`OSSInsight: ${ossInsightRepos.length} repos`);
  
  const uniqueRepos = deduplicateRepos([...ycRepos, ...ossInsightRepos]);
  
  // Sort by stars (descending) and take top N
  const sortedRepos = uniqueRepos
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit);
  
  console.log(`Total unique repos: ${uniqueRepos.length}, Selected: ${sortedRepos.length}`);
  
  return sortedRepos;
}
