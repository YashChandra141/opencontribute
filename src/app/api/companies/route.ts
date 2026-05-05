import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies, repositories } from '@/db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';
import { fallbackCompanies } from '@/lib/fallback-data';
import { discoverStartups } from '@/lib/discovery';
import { fetchYcCompanies } from '@/lib/yc-api';

interface DiscoveredCompanyCacheItem {
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

const LIVE_COMPANIES_CACHE_TTL_MS = 20 * 60 * 1000;
let liveCompaniesCache: {
  data: DiscoveredCompanyCacheItem[];
  fetchedAt: number;
} | null = null;

async function getCachedLiveCompanies(limitHint: number): Promise<DiscoveredCompanyCacheItem[]> {
  const now = Date.now();
  if (liveCompaniesCache && now - liveCompaniesCache.fetchedAt < LIVE_COMPANIES_CACHE_TTL_MS) {
    return liveCompaniesCache.data;
  }

  const discovered = await discoverStartups(Math.max(limitHint * 8, 120));
  const mapped = discovered.map((repo, index) => ({
    id: index + 1,
    name: repo.name,
    githubOrg: repo.githubOrg,
    description: repo.description || 'Auto-discovered from GitHub and OSSInsight.',
    website: repo.website || '',
    domain: repo.domain,
    discoverySource: repo.discoverySource,
    stars: repo.stars,
    forks: repo.forks,
    repoCount: 1,
    totalIssues: repo.openIssuesCount,
    avgGemScore: Math.round((repo.openIssuesCount * 100) / Math.max(repo.stars, 1)),
    createdAt: new Date().toISOString(),
  }));

  liveCompaniesCache = { data: mapped, fetchedAt: now };
  return mapped;
}

// GET /api/companies - Get companies with stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const domain = searchParams.get('domain');
  const sort = searchParams.get('sort') || 'stars';

  if (!source || source === 'YCApi') {
    try {
      let ycCompanies = await fetchYcCompanies('all');
      if (domain) ycCompanies = ycCompanies.filter((company) => company.domain === domain);
      if (sort === 'issues') ycCompanies.sort((a, b) => b.totalIssues - a.totalIssues);
      else if (sort === 'name') ycCompanies.sort((a, b) => a.name.localeCompare(b.name));
      else ycCompanies.sort((a, b) => b.stars - a.stars);

      const total = ycCompanies.length;
      const offset = (page - 1) * limit;
      const paged = ycCompanies.slice(offset, offset + limit);

      return NextResponse.json({
        companies: paged,
        domains: Array.from(new Set(ycCompanies.map((company) => company.domain))),
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        source: 'YCApi',
      });
    } catch (error) {
      console.error('YC API companies fetch failed:', error);
    }
  }

  try {
    
    // Filters
    const offset = (page - 1) * limit;
    
    const filters = [];
    if (domain) filters.push(eq(companies.domain, domain));
    if (source) filters.push(eq(companies.discoverySource, source));

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
    
    if (filters.length > 0) {
      query = query.where(and(...filters));
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
    const countQuery = filters.length > 0
      ? db.select({ count: sql`count(*)` }).from(companies).where(and(...filters))
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
      discoverySource: company.discoverySource,
      stars: company.stars,
      forks: company.forks,
      repoCount,
      totalIssues,
      avgGemScore: Math.round(avgGemScore),
      createdAt: company.createdAt,
    }));
    
    if (formattedCompanies.length === 0) {
      const discovered = await discoverStartups(Math.max(limit, 12));
      const transientCompanies = discovered.map((repo, index) => ({
        id: index + 1,
        name: repo.name,
        githubOrg: repo.githubOrg,
        description: repo.description || 'Auto-discovered from GitHub.',
        website: repo.website || '',
        domain: repo.domain,
        discoverySource: repo.discoverySource,
        stars: repo.stars,
        forks: repo.forks,
        repoCount: 1,
        totalIssues: repo.openIssuesCount,
        avgGemScore: Math.round((repo.openIssuesCount * 100) / Math.max(repo.stars, 1)),
        createdAt: new Date().toISOString(),
      }));

      let liveFiltered = transientCompanies;
      if (domain) liveFiltered = liveFiltered.filter((company) => company.domain === domain);
      if (source) liveFiltered = liveFiltered.filter((company) => company.discoverySource === source);

      const sorted = [...liveFiltered].sort((a, b) => {
        if (sort === 'issues') return b.totalIssues - a.totalIssues;
        if (sort === 'name') return a.name.localeCompare(b.name);
        return b.stars - a.stars;
      });
      const livePaged = sorted.slice(offset, offset + limit);

      return NextResponse.json({
        companies: livePaged,
        domains: Array.from(new Set(transientCompanies.map((company) => company.domain))),
        pagination: {
          page,
          limit,
          total: sorted.length,
          pages: Math.max(1, Math.ceil(sorted.length / limit)),
        },
        autoDiscovered: true,
        message: 'No local company records yet. Showing live GitHub discoveries.',
      });
    }

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
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const sort = searchParams.get('sort') || 'stars';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let filtered = [...fallbackCompanies];
    const source = searchParams.get('source');
    try {
      const liveCompanies = await getCachedLiveCompanies(limit);

      let filteredLive = [...liveCompanies];
      if (domain) filteredLive = filteredLive.filter((company) => company.domain === domain);
      if (source) filteredLive = filteredLive.filter((company) => company.discoverySource === source);

      if (sort === 'issues') {
        filteredLive.sort((a, b) => b.totalIssues - a.totalIssues);
      } else if (sort === 'name') {
        filteredLive.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        filteredLive.sort((a, b) => b.stars - a.stars);
      }

      const total = filteredLive.length;
      const offset = (page - 1) * limit;
      const paged = filteredLive.slice(offset, offset + limit);
      const domains = Array.from(new Set(liveCompanies.map((company) => company.domain)));

      return NextResponse.json({
        companies: paged,
        domains,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        degraded: true,
        message: 'Database unavailable. Showing live discovered companies.',
      });
    } catch {
      if (domain) {
        filtered = filtered.filter((company) => company.domain === domain);
      }
      if (source) {
        filtered = filtered.filter((company) => company.discoverySource === source);
      }

      if (sort === 'issues') {
        filtered.sort((a, b) => b.totalIssues - a.totalIssues);
      } else if (sort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        filtered.sort((a, b) => b.stars - a.stars);
      }

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paged = filtered.slice(offset, offset + limit);
      const domains = Array.from(new Set(fallbackCompanies.map((company) => company.domain)));

      return NextResponse.json({
        companies: paged,
        domains,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        degraded: true,
        message: 'Database unavailable. Serving minimal fallback companies.',
      });
    }
  }
}
