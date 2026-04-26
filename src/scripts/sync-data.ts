// Direct sync script to populate database
import { db } from '@/db';
import { companies, repositories, issues } from '@/db/schema';
import { discoverStartups } from '@/lib/discovery';
import { fetchIssuesBatch } from '@/lib/issues';
import { eq, count } from 'drizzle-orm';

async function runSync() {
  console.log('🚀 Starting sync...\n');
  
  try {
    // Step 1: Discover startups
    console.log('🔍 Discovering startups...');
    const discoveredRepos = await discoverStartups(50);
    console.log(`✅ Discovered ${discoveredRepos.length} unique startups\n`);
    
    if (discoveredRepos.length === 0) {
      console.log('❌ No repos discovered. Check OSSInsight API and GitHub API.');
      return;
    }
    
    // Step 2: Upsert companies and repos
    console.log('💾 Saving companies and repositories...');
    const repoIds: { owner: string; repo: string; repoId: number }[] = [];
    
    for (const repo of discoveredRepos) {
      // Upsert company
      const existingCompany = await db.query.companies.findFirst({
        where: eq(companies.githubOrg, repo.githubOrg),
      });
      
      let companyId: number;
      
      if (existingCompany) {
        await db.update(companies)
          .set({
            stars: repo.stars,
            forks: repo.forks,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, existingCompany.id));
        companyId = existingCompany.id;
      } else {
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
      
      process.stdout.write('.');
    }
    
    console.log(`\n✅ Saved ${discoveredRepos.length} companies/repos\n`);
    
    // Step 3: Fetch issues (limit to top 20 repos to avoid rate limits)
    console.log('🎫 Fetching issues from top repos...');
    const topRepos = repoIds.slice(0, 20);
    const issuesResults = await fetchIssuesBatch(topRepos, 30);
    
    // Step 4: Upsert issues
    console.log('💾 Saving issues...');
    let totalIssues = 0;
    
    for (const [dbRepoId, result] of issuesResults) {
      // Update repo with actual open issues count
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
          totalIssues++;
          process.stdout.write('.');
        } catch (error) {
          console.error(`\n❌ Error inserting issue ${issue.githubIssueId}:`, error);
        }
      }
    }
    
    console.log(`\n✅ Saved ${totalIssues} issues\n`);
    
    // Step 5: Calculate gem scores
    console.log('💎 Calculating gem scores...');
    const allRepos = await db.query.repositories.findMany();
    for (const repo of allRepos) {
      const openIssuesCount = repo.openIssuesCount ?? 0;
      const stars = repo.stars ?? 0;
      const gemScore = Math.round((openIssuesCount * 100) / Math.max(stars, 1));
      await db.update(repositories)
        .set({ gemScore })
        .where(eq(repositories.id, repo.id));
    }
    console.log(`✅ Updated gem scores for ${allRepos.length} repos\n`);
    
    // Final stats
    const finalCompanies = await db.select({ count: count() }).from(companies);
    const finalRepos = await db.select({ count: count() }).from(repositories);
    const finalIssues = await db.select({ count: count() }).from(issues);
    
    console.log('📊 Final Database Status:');
    console.log(`   Companies: ${finalCompanies[0].count}`);
    console.log(`   Repositories: ${finalRepos[0].count}`);
    console.log(`   Issues: ${finalIssues[0].count}`);
    console.log('\n🎉 Sync complete!');
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    console.error(error);
  }
  
  process.exit(0);
}

runSync();
