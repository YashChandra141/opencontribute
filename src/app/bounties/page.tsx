import { AppShell } from '@/components/AppShell';

interface Bounty {
  id: string;
  title: string;
  repo: string;
  stack: string[];
  expiresIn: string;
  reward: string;
}

interface CompanyApiRecord {
  id: number;
  name: string;
  githubOrg: string;
  domain: string;
  description: string;
}

async function getYcBounties(): Promise<Bounty[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/companies?limit=12&sort=stars&source=YCApi`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const companies = (data.companies || []) as CompanyApiRecord[];

    return companies.slice(0, 8).map((company, index) => ({
      id: `#YC${1000 + index}`,
      title: `Contribute to ${company.name}: improve ${company.domain.toLowerCase()} developer experience`,
      repo: `${company.githubOrg}/${company.githubOrg}`,
      stack: [company.domain, 'OSS'],
      expiresIn: `${(index % 7) + 1}d`,
      reward: `$${(1200 - index * 90).toLocaleString('en-US')}`,
    }));
  } catch {
    return [];
  }
}

export default async function BountiesPage() {
  const bounties = await getYcBounties();
  return (
    <AppShell searchPlaceholder="Search bounties...">
      <main className="mx-auto max-w-6xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_#000]">
        <div className="mb-6 border-b border-white/10 pb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">Bounty Board</p>
          <h1 className="text-4xl font-bold text-black">Claim open issues and earn rewards</h1>
        </div>

        <div className="overflow-hidden border-2 border-black bg-[#f8f9fb]">
          <div className="hidden grid-cols-[2.2fr_1fr_1fr] border-b-2 border-black bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-600 md:grid">
            <p>Issue details</p>
            <p>Tech stack</p>
            <p className="text-right">Reward / action</p>
          </div>

          {bounties.map((bounty) => (
            <article
              key={bounty.id}
              className="grid gap-4 border-b-2 border-black px-4 py-4 last:border-b-0 md:grid-cols-[2.2fr_1fr_1fr] md:items-center"
            >
              <div>
                <p className="text-base font-semibold text-black">{bounty.title}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {bounty.repo} · {bounty.id} · Expires in {bounty.expiresIn}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {bounty.stack.map((tech) => (
                  <span key={tech} className="border-2 border-black bg-white px-2 py-0.5 text-xs text-black">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <span className="text-xl font-semibold text-black">{bounty.reward}</span>
                <button className="border-2 border-black bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-[2px_2px_0_#000]">
                  Claim
                </button>
              </div>
            </article>
          ))}
          {bounties.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">No YC bounties available right now.</div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
