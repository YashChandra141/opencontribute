import { pgTable, serial, varchar, text, timestamp, integer, bigint, jsonb, index } from 'drizzle-orm/pg-core';

// Companies - Discovered startups/companies
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  githubOrg: varchar('github_org', { length: 255 }).notNull().unique(),
  description: text('description'),
  website: varchar('website', { length: 500 }),
  domain: varchar('domain', { length: 100 }).notNull(), // AI, DevTools, DevOps, Fullstack, Web3
  discoverySource: varchar('discovery_source', { length: 50 }).notNull(), // 'OSSInsight' | 'GitHubSearch'
  stars: integer('stars').default(0),
  forks: integer('forks').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  domainIdx: index('domain_idx').on(table.domain),
  githubOrgIdx: index('github_org_idx').on(table.githubOrg),
}));

// Repositories - Repos from discovered companies
export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  githubRepoId: bigint('github_repo_id', { mode: 'number' }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 500 }).notNull(), // owner/repo
  description: text('description'),
  language: varchar('language', { length: 100 }),
  stars: integer('stars').default(0),
  forks: integer('forks').default(0),
  openIssuesCount: integer('open_issues_count').default(0),
  gemScore: integer('gem_score').default(0), // (activity * 100) / stars
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  companyIdx: index('repo_company_idx').on(table.companyId),
  languageIdx: index('repo_language_idx').on(table.language),
  gemScoreIdx: index('gem_score_idx').on(table.gemScore),
}));

// Issues - Actual open issues from GitHub
export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id').references(() => repositories.id).notNull(),
  githubIssueId: bigint('github_issue_id', { mode: 'number' }).notNull().unique(),
  number: integer('number').notNull(),
  title: varchar('title', { length: 1000 }).notNull(),
  body: text('body'),
  state: varchar('state', { length: 50 }).notNull(), // open, closed
  labels: jsonb('labels').default([]), // Array of label names
  author: varchar('author', { length: 255 }),
  commentsCount: integer('comments_count').default(0),
  url: varchar('url', { length: 1000 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow(),
}, (table) => ({
  repoIdx: index('issue_repo_idx').on(table.repoId),
  stateIdx: index('issue_state_idx').on(table.state),
  labelsIdx: index('issue_labels_idx').on(table.labels),
}));

// Type exports
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
