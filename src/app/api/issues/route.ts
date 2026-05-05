import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { issues, repositories, companies } from '@/db/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { fallbackIssues } from '@/lib/fallback-data';
import { buildYcIssues } from '@/lib/yc-api';

// GET /api/issues - Get issues with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const domain = searchParams.get('domain');
    const language = searchParams.get('language');
    const companyId = searchParams.get('company');
    const search = searchParams.get('search');
    const labels = searchParams.get('labels')?.split(',');
    const sort = searchParams.get('sort') || 'newest'; // newest, popular, oldest
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Build query
    let query = db.select({
      issue: issues,
      repo: repositories,
      company: companies,
    })
    .from(issues)
    .innerJoin(repositories, eq(issues.repoId, repositories.id))
    .innerJoin(companies, eq(repositories.companyId, companies.id))
    .where(eq(issues.state, 'open'))
    .$dynamic();
    
    // Apply filters
    if (domain) {
      query = query.where(eq(companies.domain, domain));
    }
    
    if (language) {
      query = query.where(eq(repositories.language, language));
    }
    
    if (companyId) {
      query = query.where(eq(companies.id, parseInt(companyId)));
    }
    
    if (labels && labels.length > 0) {
      // Check if any of the labels match
      query = query.where(
        sql`${issues.labels}::jsonb ?| ${labels}`
      );
    }
    
    if (search) {
      query = query.where(
        sql`(
          ${issues.title} ILIKE ${`%${search}%`} OR 
          ${issues.body} ILIKE ${`%${search}%`} OR
          ${companies.name} ILIKE ${`%${search}%`}
        )`
      );
    }
    
    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.orderBy(desc(issues.createdAt));
        break;
      case 'oldest':
        query = query.orderBy(asc(issues.createdAt));
        break;
      case 'popular':
        query = query.orderBy(desc(issues.commentsCount));
        break;
      default:
        query = query.orderBy(desc(issues.createdAt));
    }
    
    // Apply pagination
    const results = await query.limit(limit).offset(offset);
    
    // Get total count for pagination
    const countResult = await db.select({ count: sql`count(*)` })
      .from(issues)
      .innerJoin(repositories, eq(issues.repoId, repositories.id))
      .innerJoin(companies, eq(repositories.companyId, companies.id))
      .where(eq(issues.state, 'open'));
    
    const total = parseInt(countResult[0]?.count as string || '0');
    
    // Format response
    const formattedIssues = results.map(({ issue, repo, company }) => ({
      id: issue.id,
      githubIssueId: issue.githubIssueId,
      number: issue.number,
      title: issue.title,
      body: issue.body?.slice(0, 500), // Truncate for response
      state: issue.state,
      labels: issue.labels,
      author: issue.author,
      commentsCount: issue.commentsCount,
      url: issue.url,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        language: repo.language,
        stars: repo.stars,
      },
      company: {
        id: company.id,
        name: company.name,
        githubOrg: company.githubOrg,
        domain: company.domain,
      },
    }));
    
    return NextResponse.json({
      issues: formattedIssues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching issues:', error);
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const language = searchParams.get('language');
    const companyId = searchParams.get('company');
    const search = (searchParams.get('search') || '').toLowerCase();
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let filtered = [...fallbackIssues];
    try {
      filtered = await buildYcIssues(Math.max(limit, 24));
    } catch (ycError) {
      console.error('YC issues generation failed:', ycError);
    }

    if (domain) {
      filtered = filtered.filter((issue) => issue.company.domain === domain);
    }

    if (language) {
      filtered = filtered.filter((issue) => issue.repository.language === language);
    }

    if (companyId) {
      const companyNumericId = parseInt(companyId);
      if (!Number.isNaN(companyNumericId)) {
        filtered = filtered.filter((issue) => issue.company.id === companyNumericId);
      }
    }

    if (search) {
      filtered = filtered.filter((issue) =>
        `${issue.title} ${issue.body} ${issue.company.name}`.toLowerCase().includes(search)
      );
    }

    if (sort === 'oldest') {
      filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sort === 'popular') {
      filtered.sort((a, b) => b.commentsCount - a.commentsCount);
    } else {
      filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      issues: paged,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      degraded: true,
      message: 'Database unavailable. Serving fallback issues.',
    });
  }
}
