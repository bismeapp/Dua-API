import { ArrowLeft } from 'lucide-react';

export interface BrowserItem {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  count?: number;
  targetCategoryId?: string;
  targetDuaId?: string;
  pdfUrl?: string;
  interactive?: boolean;
}

export interface BrowserSection {
  id: string;
  title: string;
  items: BrowserItem[];
}

export default function CollectionBrowser({
  sections,
  activeSectionId,
  language,
  isDark,
  onSelectSection,
  onSelectItem,
  onBack,
}: {
  sections: BrowserSection[];
  activeSectionId: string | null;
  language: string;
  isDark: boolean;
  onSelectSection: (sectionId: string) => void;
  onSelectItem: (sectionId: string, item: BrowserItem) => void;
  onBack: () => void;
}) {
  const activeSection = sections.find(section => section.id === activeSectionId);

  if (!activeSection) {
    return (
      <nav aria-label="Islamic collections">
        <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              data-section-id={section.id}
              onClick={() => onSelectSection(section.id)}
              className="category-card animate-fade-in"
            >
              <span className="category-label">{section.title}</span>
              <span className="category-count">{section.items.length}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <section aria-label={`${activeSection.title} collections`}>
      <button
        type="button"
        onClick={onBack}
        className="category-back-button mb-5 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {language === 'ta' ? 'பிரிவுகளுக்குத் திரும்பு' : language === 'ml' ? 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക' : 'Back to sections'}
      </button>
      <header className="category-detail-header mb-5 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-bold sm:text-2xl">{activeSection.title}</h2>
      </header>
      <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {activeSection.items.map(item => {
          const cardContent = (
            <>
              <span className="min-w-0">
                <span className="category-label block">{item.title}</span>
                <span className="mt-1 block text-xs text-[var(--bisme-text-muted)]">
                  {item.statusLabel}
                </span>
              </span>
              {typeof item.count === 'number' && (
                <span className="category-count">{item.count}</span>
              )}
            </>
          );
          const cardClass = `category-card animate-fade-in ${item.targetCategoryId || item.interactive ? 'cursor-pointer' : 'cursor-default'}`;

          return item.targetCategoryId || item.interactive ? (
            <button
              key={item.id}
              type="button"
              data-collection-id={item.id}
              data-target-category-id={item.targetCategoryId}
              onClick={() => onSelectItem(activeSection.id, item)}
              className={cardClass}
            >
              {cardContent}
            </button>
          ) : (
            <div
              key={item.id}
              data-collection-id={item.id}
              className={`${cardClass} ${isDark ? '' : 'bg-white'}`}
              aria-label={`${item.title}: ${item.statusLabel}`}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}
