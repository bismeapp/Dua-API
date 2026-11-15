import { Search } from 'lucide-react';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  language,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  language: string;
}) {
  const placeholder = language === 'en' ? 'Search duas by name or translation...' :
    language === 'ar' ? 'ابحث عن الأدعية بالاسم أو الترجمة...' :
    language === 'ur' ? 'نام یا ترجمہ سے دعائیں تلاش کریں...' :
    language === 'fr' ? 'Rechercher des duas par nom ou traduction...' :
    language === 'tr' ? 'İsim veya çeviriye göre dua ara...' :
    language === 'id' ? 'Cari doa berdasarkan nama atau terjemahan...' :
    language === 'bn' ? 'নাম বা অনুবাদ দিয়ে দোয়া খুঁজুন...' :
    language === 'ms' ? 'Cari doa berdasarkan nama atau terjemahan...' :
    language === 'ta' ? 'பெயர் அல்லது மொழிபெயர்ப்பால் துஆக்களைத் தேடுங்கள்...' :
    'പേര് അല്ലെങ്കിൽ വിവർത്തനം അനുസരിച്ച് ദുആകൾ തിരയുക...';

  return (
    <div className="flex-1 min-w-0">
      <div className="glass-search relative flex h-[46px] min-w-0 items-center gap-2 rounded-full px-3">
        <Search className="glass-search-icon h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="glass-search-input box-border h-full min-w-0 flex-1 font-sans text-[14px] font-normal"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="glass-search-clear shrink-0 text-sm"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
