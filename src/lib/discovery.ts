// Discovery Engine: OSSInsight + GitHub Search
// Finds under-the-radar startups in AI, DevTools, DevOps, Fullstack, Web3

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OSSINSIGHT_URL = process.env.OSSINSIGHT_BASE_URL || 'https://api.ossinsight.io/v1';

// Priority domains with their OSSInsight collection IDs
const DOMAIN_COLLECTIONS: Record<string, number[]> = {
  AI: [10010, 10076, 10098, 10106, 10112], // AI, LLM Tools, AI Agent Frameworks, Coding Agents, AI Coding Assistants
  DevTools: [10087, 10047, 10015, 10064], // LLM DevTools, Terminal, Text Editor, JS Build Tool
  DevOps: [10020, 10054, 10053, 10063], // CI/CD, Monitoring, Config Management, K8s Tooling
  Fullstack: [10004, 10005, 10019, 10090], // Web Framework, JS Framework, React Framework, Go Web Frameworks
  Web3: [10031], // Web3
};

// GitHub search queries for each domain
const GITHUB_SEARCHES: Record<string, string[]> = {
  AI: [
    'topic:artificial-intelligence stars:500..20000 pushed:>2024-01-01',
    'topic:machine-learning stars:500..20000 pushed:>2024-01-01',
    'topic:llm stars:500..20000 pushed:>2024-01-01',
  ],
  DevTools: [
    'topic:developer-tools stars:500..20000 pushed:>2024-01-01',
    'topic:devtools stars:500..20000 pushed:>2024-01-01',
    'topic:cli stars:500..20000 pushed:>2024-01-01',
  ],
  DevOps: [
    'topic:devops stars:500..20000 pushed:>2024-01-01',
    'topic:ci-cd stars:500..20000 pushed:>2024-01-01',
    'topic:infrastructure stars:500..20000 pushed:>2024-01-01',
  ],
  Fullstack: [
    'topic:fullstack stars:500..20000 pushed:>2024-01-01',
    'topic:web-framework stars:500..20000 pushed:>2024-01-01',
    'topic:backend stars:500..20000 pushed:>2024-01-01',
  ],
  Web3: [
    'topic:web3 stars:500..20000 pushed:>2024-01-01',
    'topic:blockchain stars:500..20000 pushed:>2024-01-01',
    'topic:defi stars:500..20000 pushed:>2024-01-01',
  ],
};

interface DiscoveredRepo {
  githubOrg: string;
  name: string;
  description: string | null;
  website: string | null;
  domain: string;
  discoverySource: 'OSSInsight' | 'GitHubSearch';
  stars: number;
  forks: number;
  fullName: string;
  language: string | null;
  openIssuesCount: number;
  repoId: number;
}

// Fetch from OSSInsight collections
async function fetchFromOSSInsight(): Promise<DiscoveredRepo[]> {
  const repos: DiscoveredRepo[] = [];
  
  for (const [domain, collectionIds] of Object.entries(DOMAIN_COLLECTIONS)) {
    for (const collectionId of collectionIds) {
      try {
        // Get collection items
        const response = await fetch(`${OSSINSIGHT_URL}/collections/${collectionId}/repos`);
        if (!response.ok) continue;
        
        const data = await response.json();
        if (!data.data?.rows) continue;
        
        for (const row of data.data.rows) {
          // Filter: under 20k stars, over 500 stars
          const stars = parseInt(row.stars) || 0;
          if (stars < 500 || stars > 20000) continue;
          
          const [owner, repo] = row.repo_name.split('/');
          if (!owner || !repo) continue;
          
          repos.push({
            githubOrg: owner,
            name: owner, // Company/org name
            description: row.description || null,
            website: null,
            domain,
            discoverySource: 'OSSInsight',
            stars,
            forks: parseInt(row.forks) || 0,
            fullName: row.repo_name,
            language: row.primary_language || null,
            openIssuesCount: 0, // Will be fetched via GitHub API
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

// Fetch from GitHub Search API
async function fetchFromGitHubSearch(): Promise<DiscoveredRepo[]> {
  const repos: DiscoveredRepo[] = [];
  
  for (const [domain, queries] of Object.entries(GITHUB_SEARCHES)) {
    for (const query of queries) {
      try {
        // Search repos
        const response = await octokit.rest.search.repos({
          q: query,
          sort: 'updated',
          order: 'desc',
          per_page: 30,
        });
        
        for (const repo of response.data.items || []) {
          // Filter out mega-popular repos
          if (repo.stargazers_count > 20000) continue;
          if (repo.stargazers_count < 500) continue;
          
          // Get org from repo full_name
          const [owner] = repo.full_name.split('/');
          
          repos.push({
            githubOrg: owner,
            name: owner,
            description: repo.description,
            website: repo.homepage,
            domain,
            discoverySource: 'GitHubSearch',
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            fullName: repo.full_name,
            language: repo.language,
            openIssuesCount: repo.open_issues_count,
            repoId: repo.id,
          });
        }
      } catch (error) {
        console.error(`GitHub search error for ${domain}:`, error);
      }
    }
  }
  
  return repos;
}

// Deduplicate repos by githubOrg
function deduplicateRepos(repos: DiscoveredRepo[]): DiscoveredRepo[] {
  const seen = new Map<string, DiscoveredRepo>();
  
  for (const repo of repos) {
    const existing = seen.get(repo.githubOrg);
    
    // Keep the one with higher stars or OSSInsight over GitHubSearch
    if (!existing || 
        repo.stars > existing.stars || 
        (repo.stars === existing.stars && repo.discoverySource === 'OSSInsight')) {
      seen.set(repo.githubOrg, repo);
    }
  }
  
  return Array.from(seen.values());
}

// Main discovery function
export async function discoverStartups(limit: number = 50): Promise<DiscoveredRepo[]> {
  console.log('Starting discovery...');
  
  // Fetch from both sources
  const [ossInsightRepos, gitHubRepos] = await Promise.all([
    fetchFromOSSInsight(),
    fetchFromGitHubSearch(),
  ]);
  
  console.log(`OSSInsight: ${ossInsightRepos.length} repos`);
  console.log(`GitHub Search: ${gitHubRepos.length} repos`);
  
  // Combine and deduplicate
  const allRepos = [...ossInsightRepos, ...gitHubRepos];
  const uniqueRepos = deduplicateRepos(allRepos);
  
  // Sort by stars (descending) and take top N
  const sortedRepos = uniqueRepos
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit);
  
  console.log(`Total unique repos: ${uniqueRepos.length}, Selected: ${sortedRepos.length}`);
  
  return sortedRepos;
}
