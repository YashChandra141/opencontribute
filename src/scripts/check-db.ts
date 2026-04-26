import { db } from '@/db';
import { companies, repositories, issues } from '@/db/schema';
import { count } from 'drizzle-orm';

async function checkDatabase() {
  console.log('Checking database status...\n');
  
  try {
    const companyCount = await db.select({ count: count() }).from(companies);
    const repoCount = await db.select({ count: count() }).from(repositories);
    const issueCount = await db.select({ count: count() }).from(issues);
    
    console.log('📊 Database Status:');
    console.log(`   Companies: ${companyCount[0].count}`);
    console.log(`   Repositories: ${repoCount[0].count}`);
    console.log(`   Issues: ${issueCount[0].count}`);
    
    if (companyCount[0].count > 0) {
      const sampleCompanies = await db.query.companies.findMany({ limit: 5 });
      console.log('\n🏢 Sample Companies:');
      sampleCompanies.forEach(c => {
        console.log(`   - ${c.name} (${c.domain}) - ${c.stars} stars`);
      });
    }
    
    if (issueCount[0].count > 0) {
      const sampleIssues = await db.query.issues.findMany({
        with: {
          repository: true,
        },
        limit: 3,
      });
      console.log('\n🎫 Sample Issues:');
      sampleIssues.forEach(i => {
        console.log(`   - #${i.number}: ${i.title.slice(0, 50)}...`);
      });
    } else {
      console.log('\n⚠️  No issues found in database.');
      console.log('   Run: curl -X POST http://localhost:3000/api/sync');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
  
  process.exit(0);
}

checkDatabase();
