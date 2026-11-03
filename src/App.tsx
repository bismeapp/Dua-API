import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import duasData from './data/allData.json';
import manifestData from '../data/manifest.json';
import publicDuaCategoriesData from '../data/duas/public-categories.json';
import dhikrIndexData from '../data/dhikr/index.json';
import adhkarData from '../data/dhikr/daily-dhikir.json';
import mawlidIndexData from '../data/mawlid/index.json';
import baithIndexData from '../data/baith/index.json';
import salawathIndexData from '../data/salawath/index.json';
import rathibIndexData from '../data/rathib/index.json';
import othersIndexData from '../data/others/index.json';
import salawathContentData from '../data/duas/categories/salawat/duas.json';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BookmarksProvider, useBookmarks } from './contexts/BookmarksContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import CategoryCard from './components/CategoryCard';
import CollectionBrowser, { type BrowserItem, type BrowserSection } from './components/CollectionBrowser';
import AlamSalawathView from './components/AlamSalawathView';
import RathibPdfViewer from './components/RathibPdfViewer';
import DuaDetail from './components/DuaDetail';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Settings from './components/Settings';
import BookmarksView from './components/BookmarksView';
import AsmaUlHusnaView from './components/AsmaUlHusnaView';
import AsmaUlAnbiyaView from './components/AsmaUlAnbiyaView';
import AsmaUnNabiView from './components/AsmaUnNabiView';
import MawlidView from './components/MawlidView';
import DhikrView, { type DhikrRecord } from './components/DhikrView';
import QaseedahBurdahView from './components/QaseedahBurdahView';
import HajjUmrahView from './components/HajjUmrahView';
import DuaReminder from './components/DuaReminder';
import { getDuaHeading, stripReferenceMarkers } from './utils/text';

type LanguageCode = 'en' | 'ar' | 'ur' | 'fr' | 'tr' | 'id' | 'bn' | 'ms' | 'ta' | 'ml';

interface Dua {
  id: string;
  title: Record<string, string>;
  heading?: Record<string, string>;
  arabic: string;
  translation: Record<string, string>;
  transliteration?: string;
  section_id?: string;
  translation_status?: string;
  reference?: string | { source?: string; reference_text?: string };
  times: number;
  item_number?: number;
  section_letter?: string;
  section_title?: Record<string, string>;
  notes?: Record<string, string>;
  classification?: Record<string, string>;
}

interface Category {
  id: string;
  color: string;
  gradient: string;
  bg: string;
  border: string;
  text: string;
  name: Record<string, string>;
  duas: Dua[];
  sections?: {
    id: string;
    section_number: number;
    title: string;
    title_localized: Record<string, string>;
    verse_ids: string[];
    display_groups?: {
      id: string;
      title: string;
      verse_ids: string[];
    }[];
  }[];
  displayTitle?: Record<string, string>;
  hajjSections?: {
    id: string;
    section_number: number;
    letter: string;
    title_localized: Record<string, string>;
    introduction?: Record<string, string>;
    item_numbers: number[];
    dua_ids: string[];
  }[];
}

type ViewMode = 'categories' | 'bookmarks';

interface AppHistoryState {
  bismeDuas: true;
  depth: number;
  categoryId: string | null;
  duaId: string | null;
  sectionId: string | null;
  collectionId: string | null;
  viewMode: ViewMode;
  searchQuery: string;
}

const catalogIndexes = {
  dhikr: dhikrIndexData.categories,
  mawlid: mawlidIndexData.collections,
  baith: baithIndexData.collections,
  salawath: salawathIndexData.collections,
  rathib: rathibIndexData.collections,
  others: othersIndexData.collections,
};

// Lower-cases and strips Arabic diacritics, Latin accents and apostrophe-like marks
// so that "a'laa", "aalaa" style spellings and Arabic with/without harakat all match.
const normalize = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/['’‘ʿʻ`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const referenceText = (ref: Dua['reference'] | undefined) =>
  !ref ? '' : typeof ref === 'string' ? ref : [ref.source, ref.reference_text].filter(Boolean).join(' ');

const localizedLabel = (labels: Record<string, string> | undefined, language: string) =>
  labels?.[language] || labels?.en;

const localizedStrings = (values: object): Record<string, string> =>
  Object.entries(values).reduce<Record<string, string>>((result, [key, value]) => {
    if (typeof value === 'string') result[key] = value;
    return result;
  }, {});

const duaSearchText = (dua: Dua, additionalTitles: string[] = []) =>
  normalize([
    ...additionalTitles,
    ...Object.values(dua.title || {}),
    ...Object.values(dua.heading || {}),
    ...Object.values(dua.translation || {}),
    ...Object.values(dua.notes || {}),
    ...Object.values(dua.classification || {}),
    ...Object.values(dua.section_title || {}),
    dua.arabic,
    dua.transliteration,
    referenceText(dua.reference),
  ].filter(Boolean).join(' \n '));

function AppContent() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [showImportantTexts, setShowImportantTexts] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const historyDepth = useRef(0);
  const { isDark } = useTheme();
  const { bookmarks } = useBookmarks();

  const categories = useMemo(() => {
    const sourceRecord = salawathContentData.duas.find(dua => dua.id === 'alam-salawath');
    const alamSalawath: Dua | undefined = sourceRecord ? {
      id: sourceRecord.id,
      title: localizedStrings(sourceRecord.title),
      arabic: sourceRecord.arabic,
      translation: localizedStrings(sourceRecord.translation),
      times: sourceRecord.repetition_count ?? 1,
    } : undefined;
    const duaCategories = (duasData.categories as Category[])
      .map(category => {
        if (
          category.id !== 'salawat' ||
          !alamSalawath ||
          category.duas.some(dua => dua.id === alamSalawath.id)
        ) {
          return category;
        }

        return {
          ...category,
          duas: [...category.duas, alamSalawath],
        };
      })
      .filter(category => category.duas.length > 0);

    // Keep the catch-all "Others" category at the very end of the list.
    const isOthers = (category: Category) => category.id.toLowerCase() === 'others';
    return [
      ...duaCategories.filter(category => !isOthers(category)),
      ...duaCategories.filter(isOthers),
    ];
  }, []);
  const languages = duasData.languages;
  const browserSections = useMemo<BrowserSection[]>(() => {
    const duaItems: BrowserItem[] = publicDuaCategoriesData.categories.map(item => {
      const source = categories.find(category => category.id === item.source_category_id);
      return {
        id: item.id,
        title: source?.name[language] || source?.name.en || item.id,
        status: 'available',
        statusLabel: `${source?.duas.length ?? 0} duas`,
        count: source?.duas.length ?? 0,
        targetCategoryId: item.source_category_id,
      };
    });

    return manifestData.main_sections.map(section => {
      if (section.id === 'duas') {
        return {
          id: section.id,
          title: localizedLabel(section.title as Record<string, string>, language) || section.title.en,
          items: duaItems,
        };
      }

      const entries = catalogIndexes[section.id as keyof typeof catalogIndexes] || [];
      const items: BrowserItem[] = entries.map(entry => {
        const salawatRecord = section.id === 'salawath' && 'record_id' in entry
          ? categories.find(category => category.id === 'salawat')?.duas.find(dua => dua.id === entry.record_id)
          : undefined;
        const title = salawatRecord?.title[language] || localizedLabel(
          entry.title as Record<string, string> | undefined,
          language
        ) || entry.id;
        const targetCategoryId = section.id === 'mawlid'
          ? 'mawlid'
          : section.id === 'baith'
            ? entry.id === 'ashrakal-baith' ? 'mawlid' : entry.id === 'qaseedah-burdah' ? 'qaseedah-burdah' : undefined
            : section.id === 'salawath'
              ? salawatRecord ? 'salawat' : undefined
              : section.id === 'others'
                ? entry.id
                : undefined;
        const expectedCount = 'expected_record_count' in entry ? entry.expected_record_count : undefined;
        const recordCount = expectedCount ?? ('record_count' in entry ? entry.record_count : undefined);
        const pdfUrl = 'pdf_file' in entry ? entry.pdf_file : undefined;
        return {
          id: entry.id,
          title,
          status: entry.status || 'pending_verified_source',
          statusLabel: section.id === 'dhikr' || (section.id === 'rathib' && pdfUrl)
            ? section.id === 'rathib' ? 'PDF available' : 'Available'
            : targetCategoryId
              ? typeof recordCount === 'number' ? `${recordCount} records` : 'Available'
              : 'Pending verified content',
          ...(typeof recordCount === 'number' ? { count: recordCount } : {}),
          ...(targetCategoryId ? { targetCategoryId } : {}),
          ...(salawatRecord ? { targetDuaId: salawatRecord.id } : {}),
          ...(pdfUrl ? { pdfUrl, interactive: true } : {}),
          ...(section.id === 'dhikr' ? { interactive: true } : {}),
        };
      });
      return {
        id: section.id,
        title: localizedLabel(section.title as Record<string, string>, language) || section.title.en,
        items,
      };
    });
  }, [categories, language]);

  useEffect(() => {
    const existingState = window.history.state;
    const initialState: AppHistoryState = {
      ...(existingState && typeof existingState === 'object' ? existingState : {}),
      bismeDuas: true,
      depth: 0,
      categoryId: null,
      duaId: null,
      sectionId: null,
      collectionId: null,
      viewMode: 'categories',
      searchQuery: '',
    };
    window.history.replaceState(initialState, '');

    const restoreState = (state: AppHistoryState) => {
      const category = categories.find(item => item.id === state.categoryId) || null;
      const dua = category?.duas.find(item => item.id === state.duaId) || null;
      setSelectedCategory(category);
      setSelectedDua(dua);
      setSelectedSectionId(state.sectionId || null);
      setSelectedCollectionId(state.collectionId || null);
      setViewMode(state.viewMode === 'bookmarks' ? 'bookmarks' : 'categories');
      setSearchQuery(state.searchQuery || '');
      historyDepth.current = state.depth;
    };

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as Partial<AppHistoryState> | null;
      if (state?.bismeDuas && typeof state.depth === 'number') {
        restoreState(state as AppHistoryState);
        return;
      }

      historyDepth.current = 0;
      setSelectedCategory(null);
      setSelectedDua(null);
      setSelectedSectionId(null);
      setSelectedCollectionId(null);
      setViewMode('categories');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories]);

  useEffect(() => {
    const updateScrollButton = () => setShowScrollToTop(window.scrollY > 300);
    updateScrollButton();
    window.addEventListener('scroll', updateScrollButton, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollButton);
  }, []);

  const applyNavigationState = (state: AppHistoryState) => {
    const category = categories.find(item => item.id === state.categoryId) || null;
    const dua = category?.duas.find(item => item.id === state.duaId) || null;
    setSelectedCategory(category);
    setSelectedDua(dua);
    setSelectedSectionId(state.sectionId || null);
    setSelectedCollectionId(state.collectionId || null);
    setViewMode(state.viewMode);
    setSearchQuery(state.searchQuery);
    historyDepth.current = state.depth;
  };

  const navigateTo = (
    categoryId: string | null,
    duaId: string | null,
    mode = viewMode,
    collectionId: string | null = null,
  ) => {
    const state: AppHistoryState = {
      bismeDuas: true,
      depth: historyDepth.current + 1,
      categoryId,
      duaId,
      sectionId: selectedSectionId,
      collectionId,
      viewMode: mode,
      searchQuery,
    };
    window.history.pushState(state, '');
    applyNavigationState(state);
  };

  const navigateToSection = (sectionId: string) => {
    const state: AppHistoryState = {
      bismeDuas: true,
      depth: historyDepth.current + 1,
      categoryId: null,
      duaId: null,
      sectionId,
      collectionId: null,
      viewMode: 'categories',
      searchQuery,
    };
    window.history.pushState(state, '');
    applyNavigationState(state);
  };

  const openCatalogItem = (sectionId: string, item: BrowserItem) => {
    navigateTo(item.targetCategoryId || null, item.targetDuaId || null, 'categories', item.id);
  };

  const goBack = () => {
    const currentState = window.history.state as Partial<AppHistoryState> | null;
    if (historyDepth.current > 0 && currentState?.bismeDuas) {
      window.history.back();
      return;
    }

    const state: AppHistoryState = {
      bismeDuas: true,
      depth: 0,
      categoryId: null,
      duaId: null,
      sectionId: null,
      collectionId: null,
      viewMode: 'categories',
      searchQuery,
    };
    window.history.replaceState(state, '');
    applyNavigationState(state);
  };

  const goHome = () => {
    const state: AppHistoryState = {
      bismeDuas: true,
      depth: 0,
      categoryId: null,
      duaId: null,
      sectionId: null,
      collectionId: null,
      viewMode: 'categories',
      searchQuery,
    };
    window.history.replaceState(state, '');
    applyNavigationState(state);
  };

  const normalizedQuery = useMemo(() => normalize(searchQuery), [searchQuery]);
  const isSearching = normalizedQuery.length > 0;

  // Pre-computed searchable text for every dua (all categories, including "Others").
  const searchIndex = useMemo(
    () => categories.flatMap(category => {
      const sectionsById = new Map((category.sections || []).map(section => [section.id, section]));
      return category.duas.map(dua => {
        const section = dua.section_id ? sectionsById.get(dua.section_id) : undefined;
        const groupTitles = section?.display_groups
          ?.filter(group => group.verse_ids.includes(dua.id))
          .map(group => group.title) || [];
        return {
          category,
          dua,
          text: duaSearchText(dua, [
            ...(section ? [section.title, ...Object.values(section.title_localized)] : []),
            ...groupTitles,
          ]),
        };
      });
    }),
    [categories]
  );

  // Individual duas matching the query, across every category.
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return searchIndex.filter(item => item.text.includes(normalizedQuery));
  }, [isSearching, normalizedQuery, searchIndex]);

  // Categories whose own name matches the query.
  const filteredCategories = useMemo(() => {
    if (!isSearching) return categories;
    return categories.filter(cat =>
      normalize(Object.values(cat.name).join(' ')).includes(normalizedQuery)
    );
  }, [isSearching, normalizedQuery, categories]);

  // Inside an open category, narrow the list by the search text too.
  const visibleCategoryDuas = useMemo(() => {
    if (!selectedCategory) return [];
    if (!isSearching) return selectedCategory.duas;
    return searchIndex
      .filter(item => item.category.id === selectedCategory.id && item.text.includes(normalizedQuery))
      .map(item => item.dua);
  }, [selectedCategory, isSearching, normalizedQuery, searchIndex]);
  const visibleSearchResults = selectedCategory
    ? searchResults.filter(item => item.category.id === selectedCategory.id)
    : searchResults;

  const currentLanguage = languages.find(l => l.code === language) || languages[0];
  const selectedRathibCollection = selectedSectionId === 'rathib'
    ? rathibIndexData.collections.find(item => item.id === selectedCollectionId)
    : undefined;
  const selectedRathibPdf = selectedRathibCollection && 'pdf_file' in selectedRathibCollection
    ? selectedRathibCollection.pdf_file
    : null;
  const selectedRathibTitle = selectedRathibCollection
    ? localizedLabel(selectedRathibCollection.title as Record<string, string>, language) || 'Rathib PDF'
    : 'Rathib PDF';
  const handleDuaClickFromBookmarks = (dua: any, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      navigateTo(category.id, dua.id, 'bookmarks');
    }
  };

  const bannerText = {
    en: 'Select a section to browse its collections',
    ar: 'اختر قسماً لتصفح مجموعاته',
    ur: 'مجموعے دیکھنے کے لیے ایک حصہ منتخب کریں',
    fr: 'Sélectionnez une section pour parcourir ses collections',
    tr: 'Koleksiyonlara göz atmak için bir bölüm seçin',
    id: 'Pilih bagian untuk melihat koleksinya',
    bn: 'সংগ্রহ দেখতে একটি বিভাগ বেছে নিন',
    ms: 'Pilih bahagian untuk melihat koleksinya',
    ta: 'தொகுப்புகளைக் காண ஒரு பிரிவைத் தேர்ந்தெடுக்கவும்',
    ml: 'ശേഖരങ്ങൾ കാണാൻ ഒരു വിഭാഗം തിരഞ്ഞെടുക്കുക',
  };

  return (
    <div
      dir={language === 'ar' || language === 'ur' ? 'rtl' : 'ltr'}
      className={`min-h-screen overflow-x-clip bg-[var(--bisme-bg-primary)] text-white ${language === 'ar' ? 'arabic-locale' : ''}`}
    >
      {!selectedRathibPdf && <Header
        language={language}
        languages={languages}
        showLanguageMenu={showLanguageMenu}
        setShowLanguageMenu={setShowLanguageMenu}
        setLanguage={setLanguage}
        currentLanguage={currentLanguage}
        onHomeClick={goHome}
        viewMode={viewMode}
        setViewMode={setViewMode}
        bookmarksCount={bookmarks.length}
      />}
      
      <main className={selectedRathibPdf ? 'h-[100dvh] w-full p-0' : 'max-w-7xl mx-auto px-[9px] sm:px-6 lg:px-8 py-4 sm:py-8'}>
        {selectedRathibPdf ? (
          <RathibPdfViewer src={selectedRathibPdf} title={selectedRathibTitle} onBack={goBack} />
        ) : (
          <>
        {/* Search bar with the compact custom-reminders box beside it */}
        <div className="mb-4 flex flex-col md:flex-row md:items-start gap-3 sm:mb-5">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} language={language} />
          {viewMode === 'categories' && !selectedCategory && !selectedDua && (
            <DuaReminder language={language} duas={categories.flatMap(category => category.duas)} />
          )}
        </div>

        {/* View Mode Toggle */}
        {viewMode === 'categories' && !selectedCategory && !selectedDua && !selectedSectionId && !isSearching && (
          <div className="mb-4 text-center sm:mb-5">
            <p className="text-[15px] font-semibold text-[var(--bisme-gold)]">
              {bannerText[language as keyof typeof bannerText] || bannerText.en}
            </p>
          </div>
        )}

        {/* Categories Grid */}
        {viewMode === 'categories' && !selectedCategory && !selectedDua && !isSearching &&
          !(selectedSectionId === 'dhikr' && selectedCollectionId) && !selectedRathibPdf && (
          <CollectionBrowser
            sections={browserSections}
            activeSectionId={selectedSectionId}
            language={language}
            isDark={isDark}
            onSelectSection={navigateToSection}
            onSelectItem={openCatalogItem}
            onBack={goBack}
          />
        )}

        {viewMode === 'categories' && selectedSectionId === 'dhikr' && selectedCollectionId && (() => {
          const category = dhikrIndexData.categories.find(item => item.id === selectedCollectionId);
          const section = manifestData.main_sections.find(item => item.id === 'dhikr');
          const recordIds = new Set(category?.record_ids || []);
          const records = (adhkarData.adhkar as DhikrRecord[])
            .filter(record => recordIds.has(record.id));
          return category ? (
            <DhikrView
              categoryTitle={localizedLabel(
                section?.title as Record<string, string> | undefined,
                language
              ) || 'Daily Dhikir'}
              records={records}
              language={language}
              onBack={goBack}
            />
          ) : null;
        })()}

        {viewMode === 'categories' && !selectedCategory && !selectedDua && isSearching && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                language={language}
                onClick={() => navigateTo(category.id, null)}
              />
            ))}
          </div>
        )}

        {/* Search results: individual duas from every category (including Others) */}
        {viewMode === 'categories' && !selectedDua && isSearching && (!selectedCategory || selectedCategory.id === 'mawlid') && (
          <div className={filteredCategories.length > 0 ? 'mt-8' : ''}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {language === 'ar' ? 'نتائج الأدعية' : language === 'ur' ? 'دعاؤں کے نتائج' : language === 'fr' ? 'Résultats' : 'Dua results'} ({searchResults.length})
            </h2>
            {visibleSearchResults.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'ar' ? 'لا توجد نتائج' : language === 'ur' ? 'کوئی نتیجہ نہیں ملا' : language === 'fr' ? 'Aucun résultat' : 'No duas found'}
              </p>
            ) : (
              <div className="space-y-3">
                {visibleSearchResults.map(({ category, dua }) => (
                  <div
                    key={`${category.id}-${dua.id}`}
                    onClick={() => navigateTo(category.id, dua.id)}
                    className="dua-card cursor-pointer rounded-xl border p-4 transition-all duration-200"
                  >
                    <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <h3 className={`min-w-0 break-words font-semibold ${isDark ? 'text-white' : category.text}`}>
                        {stripReferenceMarkers(getDuaHeading(dua, language))}
                      </h3>
                      <span className="max-w-[45%] break-words rounded-full border border-[var(--bisme-gold-border)] bg-[#00251b] px-2 py-0.5 text-right text-xs text-[var(--bisme-text-secondary)]">
                        {category.name[language] || category.name.en}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 text-[var(--bisme-text-secondary)]">
                      {stripReferenceMarkers(dua.translation[language] || dua.translation.en)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookmarks View */}
        {viewMode === 'bookmarks' && !selectedCategory && !selectedDua && (
          <BookmarksView language={language} onDuaClick={handleDuaClickFromBookmarks} />
        )}

        {/* Special Views for Asma ul Husna and Asma ul Anbiya */}
        {selectedCategory && !selectedDua && selectedCategory.id === 'asma-ul-husna' && (
          <AsmaUlHusnaView language={language} onBack={goBack} />
        )}

        {selectedCategory && !selectedDua && selectedCategory.id === 'asma-ul-anbiya' && (
          <AsmaUlAnbiyaView language={language} onBack={goBack} />
        )}

        {selectedCategory && !selectedDua && selectedCategory.id === 'asma-un-nabi' && (
          <AsmaUnNabiView entries={selectedCategory.duas} language={language} onBack={goBack} />
        )}

        {selectedCategory && !selectedDua && selectedCategory.id === 'mawlid' && selectedCategory.sections && !isSearching && (
          <MawlidView
            entries={selectedCategory.duas as (Dua & { section_id: string; verse_number: number })[]}
            sections={selectedCategory.sections.filter(section => !selectedCollectionId || section.id === selectedCollectionId)}
            language={language}
            displayTitle={selectedCategory.displayTitle || selectedCategory.name}
            initialSectionId={selectedCollectionId}
            backLabel={selectedSectionId === 'baith' ? 'Back to Baith' : undefined}
            onBack={goBack}
          />
        )}

        {selectedCategory && selectedCategory.id === 'qaseedah-burdah' && selectedCategory.sections && (
          <QaseedahBurdahView
            entries={selectedCategory.duas as (Dua & { section_id: string; section_number: number; verse_number: number })[]}
            sections={selectedCategory.sections}
            language={language}
            displayTitle={selectedCategory.displayTitle || selectedCategory.name}
            focusVerseId={selectedDua?.id}
            onBack={goBack}
          />
        )}

        {selectedCategory && !selectedDua && selectedCategory.id === 'hajj-umrah' && selectedCategory.hajjSections && (
          <HajjUmrahView
            entries={visibleCategoryDuas}
            sections={selectedCategory.hajjSections}
            language={language}
            categoryName={selectedCategory.name[language] || selectedCategory.name.en}
            onBack={goBack}
            onDuaClick={(dua) => navigateTo(selectedCategory.id, dua.id)}
          />
        )}

        {/* Regular Category View */}
        {selectedCategory && !selectedDua && !['asma-ul-husna', 'asma-ul-anbiya', 'asma-un-nabi', 'mawlid', 'qaseedah-burdah', 'hajj-umrah'].includes(selectedCategory.id) && (
          <div>
            <button
              onClick={goBack}
              className="category-back-button mb-5 inline-flex items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>
                {language === 'en' ? 'Back to Categories' : language === 'ar' ? 'العودة للفئات' : language === 'ur' ? 'زمرہ جات پر واپس' : language === 'fr' ? 'Retour aux Catégories' : language === 'tr' ? 'Kategorilere Dön' : language === 'id' ? 'Kembali ke Kategori' : language === 'bn' ? 'বিভাগে ফিরে যান' : language === 'ms' ? 'Kembali ke Kategori' : language === 'ta' ? 'வகைகளுக்குத் திரும்பு' : 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക'}
              </span>
            </button>
            
            {/* Category Header */}
            <div className="category-detail-header mb-6 rounded-2xl p-4 sm:p-6">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{selectedCategory.name[language] || selectedCategory.name.en}</h2>
                <p className="text-sm">{visibleCategoryDuas.length} {language === 'en' ? 'duas' : language === 'ar' ? 'دعاء' : language === 'ur' ? 'دعائیں' : language === 'fr' ? 'duas' : language === 'tr' ? 'dua' : language === 'id' ? 'doa' : language === 'bn' ? 'দোয়া' : language === 'ms' ? 'doa' : language === 'ta' ? 'துஆ' : 'ദുആ'}</p>
              </div>
            </div>

            {/* Duas List */}
            <div className="space-y-4">
              {visibleCategoryDuas.map((dua, index) => (
                <div
                  key={dua.id}
                  onClick={() => navigateTo(selectedCategory.id, dua.id)}
                  className="dua-card cursor-pointer rounded-xl border p-5 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--bisme-gold-border)] bg-[#00251b] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 text-lg font-semibold text-white">
                        {stripReferenceMarkers(getDuaHeading(dua, language))}
                      </h3>
                      <p className="text-sm text-[var(--bisme-text-secondary)] line-clamp-2">
                        {stripReferenceMarkers(dua.translation[language] || dua.translation.en)}
                      </p>
                      {dua.times > 1 && (
                        <div className="mt-2">
                          <span className="rounded-full border border-[var(--bisme-gold-border)] bg-[#00251b] px-2 py-0.5 text-xs text-[var(--bisme-text-secondary)]">
                            x{dua.times}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDua?.id === 'alam-salawath' && selectedCategory?.id === 'salawat' && (
          <AlamSalawathView
            arabic={selectedDua.arabic}
            title={selectedDua.title}
            translation={selectedDua.translation}
            translationStatus={selectedDua.translation_status}
            language={language}
            onBack={goBack}
          />
        )}

        {/* Dua Detail View */}
        {selectedDua && selectedCategory && selectedCategory.id !== 'qaseedah-burdah' && selectedDua.id !== 'alam-salawath' && (
          <DuaDetail
            dua={selectedDua}
            category={selectedCategory}
            language={language}
            onBack={goBack}
          />
        )}
          </>
        )}
      </main>

      {!selectedRathibPdf && showScrollToTop && (
        <button
          type="button"
          aria-label={language === 'ar' ? 'انتقل إلى الأعلى' : language === 'ur' ? 'اوپر جائیں' : language === 'fr' ? 'Remonter en haut' : language === 'tr' ? 'Yukarı çık' : language === 'id' ? 'Gulir ke atas' : language === 'bn' ? 'উপরে যান' : language === 'ms' ? 'Tatal ke atas' : language === 'ta' ? 'மேலே செல்லவும்' : language === 'ml' ? 'മുകളിലേക്ക് പോകുക' : 'Scroll to top'}
          title={language === 'ar' ? 'انتقل إلى الأعلى' : language === 'ur' ? 'اوپر جائیں' : language === 'fr' ? 'Remonter en haut' : language === 'tr' ? 'Yukarı çık' : language === 'id' ? 'Gulir ke atas' : language === 'bn' ? 'উপরে যান' : language === 'ms' ? 'Tatal ke atas' : language === 'ta' ? 'மேலே செல்லவும்' : language === 'ml' ? 'മുകളിലേക്ക് പോകുക' : 'Scroll to top'}
          onClick={() => {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
          }}
          className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--bisme-gold-border)] bg-[#063b2b] text-[var(--bisme-gold)] shadow-lg transition-colors hover:bg-[#084633] hover:text-white sm:bottom-24 sm:right-6"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Footer */}
      {!selectedRathibPdf && <footer className="app-footer mt-16 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-wide text-[var(--bisme-gold)]">BISME RADIO</p>
        </div>
      </footer>}

      {!selectedRathibPdf && <Settings language={language} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BookmarksProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </BookmarksProvider>
    </ThemeProvider>
  );
}
