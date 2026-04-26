import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies, repositories, issues } from '@/db/schema';
import { discoverStartups } from '@/lib/discovery';
import { fetchIssuesBatch } from '@/lib/issues';
import { eq } from 'drizzle-orm';

// POST /api/sync - Trigger discovery and issue sync
export async function POST(request: NextRequest) {
  try {
    // Verify token if provided (basic security)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SYNC_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get limit from query params (default 50 companies)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log(`Starting sync with limit: ${limit}`);
    
    // Step 1: Discover startups
    const discoveredRepos = await discoverStartups(limit);
    console.log(`Discovered ${discoveredRepos.length} startups`);
    
    // Step 2: Upsert companies and repos
    const repoIds: { owner: string; repo: string; repoId: number }[] = [];
    
    for (const repo of discoveredRepos) {
      // Upsert company
      const existingCompany = await db.query.companies.findFirst({
        where: eq(companies.githubOrg, repo.githubOrg),
      });
      
      let companyId: number;
      
      if (existingCompany) {
        // Update existing
        await db.update(companies)
          .set({
            stars: repo.stars,
            forks: repo.forks,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, existingCompany.id));
        companyId = existingCompany.id;
      } else {
        // Insert new
        const [newCompany] = await db.insert(companies)
          .values({
            name: repo.name,
            githubOrg: repo.githubOrg,
            description: repo.description || '',
            website: repo.website || '',
            domain: repo.domain,
            discoverySource: repo.discoverySource,
            stars: repo.stars,
            forks: repo.forks,
          })
          .returning();
        companyId = newCompany.id;
      }
      
      // Upsert repository
      const existingRepo = await db.query.repositories.findFirst({
        where: eq(repositories.githubRepoId, repo.repoId),
      });
      
      let dbRepoId: number;
      
      if (existingRepo) {
        await db.update(repositories)
          .set({
            stars: repo.stars,
            forks: repo.forks,
            openIssuesCount: repo.openIssuesCount,
            updatedAt: new Date(),
          })
          .where(eq(repositories.id, existingRepo.id));
        dbRepoId = existingRepo.id;
      } else {
        const [newRepo] = await db.insert(repositories)
          .values({
            companyId,
            githubRepoId: repo.repoId,
            name: repo.name,
            fullName: repo.fullName,
            description: repo.description || '',
            language: repo.language || '',
            stars: repo.stars,
            forks: repo.forks,
            openIssuesCount: repo.openIssuesCount,
          })
          .returning();
        dbRepoId = newRepo.id;
      }
      
      repoIds.push({
        owner: repo.githubOrg,
        repo: repo.fullName.split('/')[1],
        repoId: dbRepoId,
      });
    }
    
    // Step 3: Fetch issues for each repo
    console.log(`Fetching issues for ${repoIds.length} repos...`);
    const issuesResults = await fetchIssuesBatch(repoIds, 50); // Max 50 issues per repo
    
    // Step 4: Upsert issues
    let totalIssuesInserted = 0;
    
    for (const [dbRepoId, result] of issuesResults) {
      // Update repo with actual open issues count and gem score
      await db.update(repositories)
        .set({
          openIssuesCount: result.openIssuesCount,
          lastSyncedAt: new Date(),
        })
        .where(eq(repositories.id, dbRepoId));
      
      // Insert issues
      for (const issue of result.issues) {
        try {
          await db.insert(issues)
            .values({
              repoId: dbRepoId,
              githubIssueId: issue.githubIssueId,
              number: issue.number,
              title: issue.title,
              body: issue.body || '',
              state: issue.state,
              labels: issue.labels,
              author: issue.author,
              commentsCount: issue.commentsCount,
              url: issue.url,
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt,
            })
            .onConflictDoUpdate({
              target: issues.githubIssueId,
              set: {
                title: issue.title,
                body: issue.body || '',
                state: issue.state,
                labels: issue.labels,
                commentsCount: issue.commentsCount,
                updatedAt: issue.updatedAt,
                fetchedAt: new Date(),
              },
            });
          totalIssuesInserted++;
        } catch (error) {
          console.error(`Error inserting issue ${issue.githubIssueId}:`, error);
        }
      }
    }
    
    // Calculate gem scores for all repos
    const allRepos = await db.query.repositories.findMany();
    for (const repo of allRepos) {
      const openIssuesCount = repo.openIssuesCount ?? 0;
      const stars = repo.stars ?? 0;
      const gemScore = Math.round((openIssuesCount * 100) / Math.max(stars, 1));
      await db.update(repositories)
        .set({ gemScore })
        .where(eq(repositories.id, repo.id));
    }
    
    return NextResponse.json({
      success: true,
      companiesDiscovered: discoveredRepos.length,
      issuesSynced: totalIssuesInserted,
      reposProcessed: repoIds.length,
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/sync - Check sync status
export async function GET() {
  try {
    const companyCount = await db.query.companies.findMany({
      columns: { id: true },
    });
    const repoCount = await db.query.repositories.findMany({
      columns: { id: true },
    });
    const issueCount = await db.query.issues.findMany({
      columns: { id: true },
    });
    
    return NextResponse.json({
      status: 'ready',
      companies: companyCount.length,
      repositories: repoCount.length,
      issues: issueCount.length,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
