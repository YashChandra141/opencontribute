'use client';

interface FilterSidebarProps {
  domains: string[];
  languages: string[];
  selectedDomain: string;
  selectedLanguage: string;
  sort: string;
  onDomainChange: (domain: string) => void;
  onLanguageChange: (language: string) => void;
  onSortChange: (sort: string) => void;
}

export function FilterSidebar({
  domains,
  languages,
  selectedDomain,
  selectedLanguage,
  sort,
  onDomainChange,
  onLanguageChange,
  onSortChange,
}: FilterSidebarProps) {
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Discussed' },
  ];

  return (
    <div className="sticky top-24 rounded-xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl shadow-black/20">
      <h2 className="mb-4 text-lg font-bold text-white">Filters</h2>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-gray-300">Domain</h3>
        <div className="space-y-2">
          <button
            onClick={() => onDomainChange('')}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              selectedDomain === ''
                ? 'bg-white text-black'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Domains
          </button>
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => onDomainChange(d)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedDomain === d
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-gray-300">Language</h3>
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-300">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-white/40"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
