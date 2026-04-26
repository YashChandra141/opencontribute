import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies, repositories } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// GET /api/companies - Get companies with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const domain = searchParams.get('domain');
    const sort = searchParams.get('sort') || 'stars'; // stars, issues, name
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Build query
    let query = db.select({
      company: companies,
      repoCount: sql<number>`count(${repositories.id})`,
      totalIssues: sql<number>`coalesce(sum(${repositories.openIssuesCount}), 0)`,
      avgGemScore: sql<number>`coalesce(avg(${repositories.gemScore}), 0)`,
    })
    .from(companies)
    .leftJoin(repositories, eq(companies.id, repositories.companyId))
    .groupBy(companies.id)
    .$dynamic();
    
    // Apply domain filter
    if (domain) {
      query = query.where(eq(companies.domain, domain));
    }
    
    // Apply sorting
    switch (sort) {
      case 'stars':
        query = query.orderBy(desc(companies.stars));
        break;
      case 'issues':
        query = query.orderBy(desc(sql`coalesce(sum(${repositories.openIssuesCount}), 0)`));
        break;
      case 'name':
        query = query.orderBy(companies.name);
        break;
      default:
        query = query.orderBy(desc(companies.stars));
    }
    
    // Apply pagination
    const results = await query.limit(limit).offset(offset);
    
    // Get total count
    const countQuery = domain 
      ? db.select({ count: sql`count(*)` }).from(companies).where(eq(companies.domain, domain))
      : db.select({ count: sql`count(*)` }).from(companies);
    const countResult = await countQuery;
    const total = parseInt(countResult[0]?.count as string || '0');
    
    // Get available domains
    const domainsResult = await db.select({ domain: companies.domain })
      .from(companies)
      .groupBy(companies.domain);
    const availableDomains = domainsResult.map(d => d.domain);
    
    // Format response
    const formattedCompanies = results.map(({ company, repoCount, totalIssues, avgGemScore }) => ({
      id: company.id,
      name: company.name,
      githubOrg: company.githubOrg,
      description: company.description,
      website: company.website,
      domain: company.domain,
      stars: company.stars,
      forks: company.forks,
      repoCount,
      totalIssues,
      avgGemScore: Math.round(avgGemScore),
      createdAt: company.createdAt,
    }));
    
    return NextResponse.json({
      companies: formattedCompanies,
      domains: availableDomains,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: String(error) },
      { status: 500 }
    );
  }
}
