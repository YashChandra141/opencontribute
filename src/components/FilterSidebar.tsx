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
    <div className="sticky top-20 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000]">
      <h2 className="mb-4 text-lg font-bold text-black">Filters</h2>

      <div className="mb-6">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Domain</h3>
        <div className="space-y-2">
          <button
            onClick={() => onDomainChange('')}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              selectedDomain === ''
                ? 'border-2 border-black bg-black text-white'
                : 'border-2 border-black text-black hover:bg-neutral-100'
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
                ? 'border-2 border-black bg-black text-white'
                : 'border-2 border-black text-black hover:bg-neutral-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Language</h3>
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full border-2 border-black bg-[#f8f9fb] px-3 py-2 text-sm text-black outline-none transition"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full border-2 border-black bg-[#f8f9fb] px-3 py-2 text-sm text-black outline-none transition"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
