// GitHub Issue Fetcher
// Fetches open issues from discovered repositories

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface FetchedIssue {
  githubIssueId: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  author: string;
  commentsCount: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FetchResult {
  issues: FetchedIssue[];
  openIssuesCount: number;
  rateLimitRemaining: number;
}

// Fetch open issues from a repository
export async function fetchRepoIssues(
  owner: string,
  repo: string,
  maxIssues: number = 100
): Promise<FetchResult> {
  const issues: FetchedIssue[] = [];
  let page = 1;
  const perPage = 100; // Max per page
  
  try {
    while (issues.length < maxIssues) {
      const response = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: Math.min(perPage, maxIssues - issues.length),
        page,
      });
      
      if (response.data.length === 0) break;
      
      for (const issue of response.data) {
        // Skip pull requests (GitHub API returns PRs as issues)
        if ('pull_request' in issue && issue.pull_request) continue;
        
        issues.push({
          githubIssueId: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body ?? null,
          state: issue.state,
          labels: issue.labels.map((l) => typeof l === 'string' ? l : l.name || '').filter(Boolean),
          author: issue.user?.login || 'unknown',
          commentsCount: issue.comments,
          url: issue.html_url,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
        });
      }
      
      page++;
      
      // Safety: if we got fewer results than per_page, we're done
      if (response.data.length < perPage) break;
    }
    
    // Get open issues count from repo info
    const repoResponse = await octokit.rest.repos.get({ owner, repo });
    
    return {
      issues,
      openIssuesCount: repoResponse.data.open_issues_count,
      rateLimitRemaining: parseInt(repoResponse.headers['x-ratelimit-remaining'] || '5000'),
    };
    
  } catch (error) {
    console.error(`Error fetching issues for ${owner}/${repo}:`, error);
    return {
      issues: [],
      openIssuesCount: 0,
      rateLimitRemaining: 0,
    };
  }
}

// Fetch issues for multiple repos with rate limit awareness
export async function fetchIssuesBatch(
  repos: { owner: string; repo: string; repoId: number }[],
  maxIssuesPerRepo: number = 50
): Promise<Map<number, FetchResult>> {
  const results = new Map<number, FetchResult>();
  
  // Process sequentially to respect rate limits
  for (const { owner, repo, repoId } of repos) {
    console.log(`Fetching issues for ${owner}/${repo}...`);
    
    const result = await fetchRepoIssues(owner, repo, maxIssuesPerRepo);
    results.set(repoId, result);
    
    // Log rate limit status
    console.log(`  Fetched ${result.issues.length} issues, Rate limit: ${result.rateLimitRemaining}`);
    
    // Sleep briefly to avoid hitting rate limits
    if (result.rateLimitRemaining < 100) {
      console.log('Rate limit low, pausing...');
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      await new Promise((r) => setTimeout(r, 500)); // Small delay between requests
    }
  }
  
  return results;
}

// Calculate gem score: (open_issues * recent_prs) / stars
// Higher = more active community, less saturated
export function calculateGemScore(
  openIssues: number,
  stars: number,
  recentPRs: number = 10 // Default assumption
): number {
  if (stars === 0) return 0;
  return Math.round((openIssues * recentPRs * 100) / stars);
}
