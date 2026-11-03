import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { getDocument } from 'pdfjs-dist';
import App from '../src/App';
import data from '../src/data/allData.json';
import manqoosSource from '../data/duas/categories/mawlid/manqoos.json';
import ashrakalBaithSource from '../data/duas/categories/mawlid/ashrakal_baith.json';
import adhkarSource from '../data/dhikr/daily-dhikir.json';
import subuhanaSource from '../data/duas/categories/mawlid/subuhana.json';
import burdahSource from '../data/duas/categories/qaseedah-burdah/content.json';
import salawathSource from '../data/duas/categories/salawat/duas.json';
import rathibSource from '../data/rathib/index.json';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        pageNumber: 1,
        getViewport: ({ scale = 1 }: { scale?: number }) => ({
          width: 100 * scale,
          height: 100 * scale,
        }),
        render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
      }),
    }),
    destroy: async () => {},
  })),
}));

const errors: string[] = [];
beforeEach(() => {
  cleanup(); localStorage.clear(); window.history.replaceState(null, '', '/');
  errors.length = 0;
  vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a.map(String).join(' ').slice(0, 300)); });
});

const cats = data.categories as any[];
const back = () => { const b = screen.queryAllByRole('button').find(x => /back|retour|العودة|geri|kembali|واپس|ফিরে|திரும்பு|മടങ്ങ/i.test(x.textContent || '')); if (b) fireEvent.click(b); return !!b; };
const openSection = (sectionId: string) => {
  const section = document.querySelector(`[data-section-id="${sectionId}"]`);
  if (section) fireEvent.click(section);
};
const openCategory = (categoryId: string) => {
  const sectionId = categoryId === 'mawlid' ? 'mawlid'
    : categoryId === 'qaseedah-burdah' ? 'baith'
      : categoryId === 'salawat' ? 'salawath'
        : categoryId.startsWith('asma-') ? 'others' : 'duas';
  openSection(sectionId);
  const category = document.querySelector(`[data-target-category-id="${categoryId}"]`);
  if (category) fireEvent.click(category);
};

describe('section browser', () => {
  it('shows all seven sections and their requested nested lists', () => {
    render(<App />);
    expect(document.querySelectorAll('[data-section-id]')).toHaveLength(7);
    for (const [sectionId, expectedCount] of [
      ['duas', 33],
      ['dhikr', 10],
      ['mawlid', 2],
      ['baith', 2],
      ['salawath', 11],
      ['rathib', 2],
      ['others', 3],
    ] as const) {
      cleanup();
      render(<App />);
      openSection(sectionId);
      expect(document.querySelectorAll('[data-collection-id]')).toHaveLength(expectedCount);
      if (sectionId === 'rathib') {
        expect(document.querySelector('[data-collection-id="rathib-jalaliyah"]')?.tagName).toBe('BUTTON');
        expect(document.querySelector('[data-collection-id="rathib-haddad"]')?.tagName).toBe('BUTTON');
        expect(document.body.textContent).toContain('Ratib al-Haddad');
      }
    }
  });

  it('opens the Rathib Jalaliyah PDF and returns to the Rathib collection list', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);

    render(<App />);
    openSection('rathib');
    fireEvent.click(document.querySelector('[data-collection-id="rathib-jalaliyah"]')!);

    await waitFor(() => {
      expect(screen.getByLabelText('PDF page 1')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Back to Rathib' })).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(1);
    expect(screen.queryAllByRole('link')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Rathib' }));
    await waitFor(() => {
      expect(document.querySelector('[data-collection-id="rathib-jalaliyah"]')).toBeTruthy();
      expect(document.querySelector('[data-collection-id="rathib-haddad"]')).toBeTruthy();
    });
  });

  it('opens the Ratib al-Haddad PDF without exposing download controls and returns to Rathib', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);

    render(<App />);
    openSection('rathib');
    fireEvent.click(document.querySelector('[data-collection-id="rathib-haddad"]')!);

    await waitFor(() => {
      expect(screen.getByLabelText('PDF page 1')).toBeTruthy();
    });
    expect(getDocument).toHaveBeenLastCalledWith({ url: '/rathib/ratib-al-haddad.pdf' });
    expect(screen.getByRole('button', { name: 'Back to Rathib' })).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(1);
    expect(screen.queryAllByRole('link')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Rathib' }));
    await waitFor(() => {
      expect(document.querySelector('[data-collection-id="rathib-haddad"]')).toBeTruthy();
      expect(document.querySelector('[data-collection-id="rathib-jalaliyah"]')).toBeTruthy();
    });
  });

  it('supports browser back from the PDF to Rathib and then to the main screen', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);

    render(<App />);
    openSection('rathib');
    fireEvent.click(document.querySelector('[data-collection-id="rathib-haddad"]')!);
    await waitFor(() => expect(screen.getByLabelText('PDF page 1')).toBeTruthy());

    window.history.back();
    await waitFor(() => {
      expect(document.querySelector('[data-collection-id="rathib-haddad"]')).toBeTruthy();
    });
    window.history.back();
    await waitFor(() => {
      expect(document.querySelector('[data-section-id="rathib"]')).toBeTruthy();
    });
  });

  it('localizes the Ratib al-Haddad collection title for every supported language', () => {
    const haddad = rathibSource.collections.find(item => item.id === 'rathib-haddad')!;
    const supportedLanguages = ['en', 'ar', 'ta', 'ml', 'ur', 'fr', 'tr', 'id', 'bn', 'ms'];
    expect(Object.keys(haddad.title).sort()).toEqual([...supportedLanguages].sort());

    for (const language of supportedLanguages) {
      cleanup();
      render(<App />);
      if (language !== 'en') {
        const english = data.languages.find(item => item.code === 'en')!;
        const languageButton = screen.getAllByRole('button').find(button => button.textContent?.includes(english.name));
        fireEvent.click(languageButton!);
        const languageOption = screen.getAllByRole('button').find(button =>
          button.textContent?.includes(data.languages.find(item => item.code === language)!.name) && button !== languageButton
        );
        fireEvent.click(languageOption!);
      }

      openSection('rathib');
      expect(document.querySelector('[data-collection-id="rathib-haddad"]')?.textContent)
        .toContain(haddad.title[language]);
    }
  });

  it('shows Day of Judgment in all supported languages without changing its records', () => {
    const category = cats.find(item => item.id === 'hereafter');
    const labels = {
      en: 'Day of Judgment',
      ta: 'மறுமை நாள்',
      ml: 'അന്ത്യദിനം',
      ar: 'يوم القيامة',
      ur: 'یومِ قیامت',
      fr: 'Jour du Jugement',
      tr: 'Kıyamet Günü',
      id: 'Hari Kiamat',
      bn: 'কিয়ামতের দিন',
      ms: 'Hari Kiamat',
    };
    const originalDuaIds = category.duas.map((dua: any) => dua.id);

    for (const [language, expectedLabel] of Object.entries(labels)) {
      cleanup();
      render(<App />);
      if (language !== 'en') {
        const english = data.languages.find(item => item.code === 'en')!;
        const languageButton = screen.getAllByRole('button').find(button => button.textContent?.includes(english.name));
        fireEvent.click(languageButton!);
        const languageOption = screen.getAllByRole('button').find(button =>
          button.textContent?.includes(data.languages.find(item => item.code === language)!.name) && button !== languageButton
        );
        fireEvent.click(languageOption!);
      }

      openSection('duas');
      expect(document.querySelector('[data-collection-id="hereafter"]')?.textContent).toContain(expectedLabel);
    }

    expect(category.duas.map((dua: any) => dua.id)).toEqual(originalDuaIds);
  });

  it('shows the existing Salawat formulas and A\'lam Salawath directly under Salawath', () => {
    render(<App />);
    openSection('salawath');
    const entries = Array.from(document.querySelectorAll('[data-collection-id]'));
    expect(entries).toHaveLength(11);
    expect(entries.map(entry => entry.getAttribute('data-collection-id'))).toEqual([
      'sal-3', 'sal-5', 'sal-6', 'sal-7', 'sal-8', 'sal-9', 'sal-10', 'sal-1', 'sal-2', 'sal-4',
      'alam-salawath',
    ]);
    fireEvent.click(entries[0]);
    expect(document.body.textContent).toContain('Salawat al-Tanjiyyah');
    expect(document.body.textContent).toContain(cats.find(category => category.id === 'salawat').duas[0].arabic);
  });

  it('displays A\'lam Salawath in the selected language and preserves the full Arabic source', () => {
    const alamSalawath = salawathSource.duas.find(record => record.id === 'alam-salawath')!;
    const closingDuaMarker = '\n\nالدعاء\n\n';
    const closingDuaIndex = alamSalawath.arabic.indexOf(closingDuaMarker);
    const languages = ['en', 'ar', 'ta', 'ml', 'ur', 'fr', 'tr', 'id', 'bn', 'ms'];
    expect(Object.keys(alamSalawath.title).sort()).toEqual([...languages].sort());
    expect(Object.keys(alamSalawath.translation).sort()).toEqual([...languages].sort());
    expect(languages.every(code => alamSalawath.title[code] && alamSalawath.translation[code])).toBe(true);

    for (const language of languages) {
      cleanup();
      render(<App />);
      if (language !== 'en') {
        const english = data.languages.find(item => item.code === 'en')!;
        const languageButton = screen.getAllByRole('button').find(button => button.textContent?.includes(english.name));
        fireEvent.click(languageButton!);
        const languageOption = screen.getAllByRole('button').find(button =>
          button.textContent?.includes(data.languages.find(item => item.code === language)!.name) && button !== languageButton
        );
        fireEvent.click(languageOption!);
      }
      openSection('salawath');
      fireEvent.click(document.querySelector('[data-collection-id="alam-salawath"]')!);

      expect(screen.getByRole('heading', { name: alamSalawath.title[language] })).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'الدعاء' })).toBeTruthy();
      expect(document.body.textContent).toContain(alamSalawath.arabic.slice(0, closingDuaIndex));
      expect(document.body.textContent).toContain(alamSalawath.arabic.slice(closingDuaIndex + closingDuaMarker.length));
      expect(document.querySelector('section[aria-label="A\'lam Salawath"] [lang="ar"][dir="rtl"]')).toBeTruthy();
      if (language === 'ar') {
        expect(document.querySelector('[aria-label="AR translation"]')).toBeNull();
      } else {
        expect(document.querySelector(`[aria-label="${language.toUpperCase()} translation"]`)?.textContent)
          .toContain(alamSalawath.translation[language]);
        expect(alamSalawath.translation_status).toContain('human review required');
      }
    }

    expect(rathibSource.collections.find(item => item.id === 'rathib-haddad'))
      .toHaveProperty('pdf_file', '/rathib/ratib-al-haddad.pdf');
  });

  it('opens Dhikr categories with only the selected translation and audio controls', async () => {
    render(<App />);
    openSection('dhikr');
    fireEvent.click(document.querySelector('[data-collection-id="subhanallah"]')!);

    const record = adhkarSource.adhkar.find(item => item.id === 'subhanallah')!;
    expect(document.body.textContent).toContain(record.arabic);
    expect(document.body.textContent).toContain(record.transliteration);
    expect(document.body.textContent).toContain('Daily Dhikir');
    expect(document.body.textContent).not.toContain('1 adhkar');
    expect(document.body.textContent).toContain(record.translation.en);
    expect(document.body.textContent).not.toContain(record.translation.ta);
    expect(document.body.textContent).not.toContain(record.translation.ml);
    expect(document.body.textContent).toContain('Sahih al-Bukhari 6405');
    expect(document.body.textContent).toContain(record.deeper_meaning.en);
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    await waitFor(() => expect(window.speechSynthesis.speak).toHaveBeenCalled());
  });

  it('shows only the active language translation for Dhikr', () => {
    render(<App />);
    const languageButton = screen.getAllByRole('button').find(button => button.textContent?.includes('English'));
    fireEvent.click(languageButton!);
    const tamilOption = screen.getAllByRole('button').find(button =>
      button.textContent?.includes('தமிழ்') && button !== languageButton
    );
    fireEvent.click(tamilOption!);

    openSection('dhikr');
    fireEvent.click(document.querySelector('[data-collection-id="subhanallah"]')!);

    const record = adhkarSource.adhkar.find(item => item.id === 'subhanallah')!;
    expect(document.body.textContent).toContain(record.translation.ta);
    expect(document.body.textContent).not.toContain(record.translation.en);
    expect(document.body.textContent).not.toContain(record.translation.ml);
  });

  it('shows the supplied French Dhikr translation', () => {
    render(<App />);
    const languageButton = screen.getAllByRole('button').find(button => button.textContent?.includes('English'));
    fireEvent.click(languageButton!);
    const frenchOption = screen.getAllByRole('button').find(button =>
      button.textContent?.includes('Français') && button !== languageButton
    );
    fireEvent.click(frenchOption!);

    openSection('dhikr');
    fireEvent.click(document.querySelector('[data-collection-id="subhanallah"]')!);

    const record = adhkarSource.adhkar.find(item => item.id === 'subhanallah')!;
    expect(document.body.textContent).toContain(record.translation.fr);
    expect(document.body.textContent).not.toContain(record.translation.en);
    expect(document.body.textContent).not.toContain(record.translation.ta);
    expect(document.body.textContent).not.toContain(record.translation.ml);
  });

  it('opens Mawlid and Ashrakal collections directly at their content', async () => {
    render(<App />);
    openSection('mawlid');
    fireEvent.click(document.querySelector('[data-collection-id="manqoos-mawlid"]')!);
    expect(document.body.textContent).toContain(manqoosSource.parts[0].arabic);
    expect(document.querySelector('.mawlid-section-card')).toBeNull();

    cleanup();
    render(<App />);
    openSection('baith');
    fireEvent.click(document.querySelector('[data-collection-id="ashrakal-baith"]')!);
    expect(document.body.textContent).toContain(ashrakalBaithSource.parts[0].arabic);
    expect(document.querySelector('.mawlid-section-card')).toBeNull();
    expect(screen.getByRole('button', { name: 'Back to Baith' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Baith' }));
    await waitFor(() => {
      expect(document.querySelector('[data-collection-id="ashrakal-baith"]')).not.toBeNull();
    });
  });
});

describe('excluded content', () => {
  it('does not include Ruqyah or explicitly Shia-specific supplications', () => {
    const collection = JSON.stringify(data.categories);
    expect(collection).not.toMatch(/ruqyah|ruqya|رقية|الرقية/i);
    expect(collection).not.toMatch(/(?:saheefah|sahifa|sahifah).{0,30}(?:alaw|alavi)|kumayl|ziyarat.{0,20}ashura|mafatih al-jinan|sahifa sajjadiya/i);
  });
});

describe('Qaseedah Burdah', () => {
  it('includes all 167 supplied Arabic-English couplets without transliteration', () => {
    const burdah = cats.find(category => category.id === 'qaseedah-burdah');
    const verses = burdahSource.sections.flatMap(section => section.verses);
    expect(verses).toHaveLength(167);
    expect(burdah.sections).toHaveLength(11);
    expect(burdah.duas).toHaveLength(167);
    expect(burdahSource.sections.map(section => section.verses.length)).toEqual([
      12, 16, 30, 13, 16, 17, 13, 22, 12, 9, 7,
    ]);
    verses.forEach((verse: any, index: number) => {
      expect(verse.verse_number).toBe(index + 1);
      expect(burdah.duas[index].arabic).toBe(verse.arabic);
      expect(burdah.duas[index].translation).toEqual({ en: verse.english });
      expect(burdah.duas[index]).not.toHaveProperty('transliteration');
    });
  });

  it('uses left-to-right English fallback when a localized verse translation is unavailable', () => {
    render(<App />);
    const languageButton = screen.getAllByRole('button').find(button =>
      (button.textContent || '').includes(data.languages[0].name)
    );
    fireEvent.click(languageButton!);
    const frenchOption = screen.getAllByRole('button').find(button =>
      (button.textContent || '').includes('Français') && button !== languageButton
    );
    fireEvent.click(frenchOption!);

    openSection('baith');
    fireEvent.click(document.querySelector('[data-collection-id="qaseedah-burdah"]')!);

    const translation = screen.getByText(burdahSource.sections[0].verses[0].english);
    expect(translation.getAttribute('dir')).toBe('auto');
    expect(screen.queryByText('Afficher la traduction anglaise')).toBeNull();
  });

  it('keeps all section titles in a horizontally scrollable navigation strip', () => {
    render(<App />);
    openCategory('qaseedah-burdah');

    const navigation = screen.getByRole('navigation', { name: 'Qaseedah sections' });
    expect(navigation.className).toContain('overflow-x-auto');
    expect(navigation.className).toContain('flex-nowrap');
    expect(within(navigation).getAllByRole('button')).toHaveLength(11);
  });
});

describe('Mawlid content', () => {
  it('keeps each mawlid whole and provides translations in every supported language', () => {
    const mawlid = cats.find(category => category.id === 'mawlid');
    expect(mawlid.duas).toHaveLength(89);
    const manqoos = mawlid.duas.find((dua: any) => dua.id === 'manqoos-mawlid-01');
    const ashrakal = mawlid.duas.find((dua: any) => dua.id === 'ashrakal-baith-01');
    const subuhana = mawlid.duas.find((dua: any) => dua.id === 'subuhana-mawlid-01');
    const subuhanaSection = mawlid.sections.find((section: any) => section.id === 'subuhana-mawlid');
    expect(manqoos.title.en).toBe('Manqoos Mawlid');
    expect(manqoos.arabic.split('\n\n')).toHaveLength(18);
    expect(manqoosSource.parts).toHaveLength(18);
    expect(manqoos.arabic).toBe(manqoosSource.parts.map(part => part.arabic).join('\n\n'));
    expect(ashrakal.title.en).toBe('Ashrakal Baith');
    expect(ashrakal.arabic.match(/۞/g)).toHaveLength(36);
    expect(ashrakal.arabic).toContain('رَبَّنَا ارْحَمْنَا جَمِيعًا');
    expect(ashrakalBaithSource.parts).toHaveLength(1);
    expect(ashrakal.arabic).toBe(ashrakalBaithSource.parts[0].arabic);
    for (const [language, parts] of Object.entries(manqoosSource.translations)) {
      expect(manqoos.translation[language]).toBe(parts.join('\n\n'));
    }
    for (const [language, parts] of Object.entries(ashrakalBaithSource.translations)) {
      expect(ashrakal.translation[language]).toBe(parts.join(''));
    }
    expect(subuhana.title.en).toMatch(/^Subuhana Mawlid/);
    expect(subuhana.arabic).toContain('اَلسَّلَامُ عَلَيْكَ زَيْنَ الْاَنْبِيَاءِ');
    expect(subuhanaSection.verse_ids).toHaveLength(subuhanaSource.parts.length);
    expect(mawlid.duas
      .filter((dua: any) => dua.section_id === 'subuhana-mawlid')
      .every((dua: any) => Object.values(dua.title).every((title: any) => !title.includes('?')))).toBe(true);
    expect(subuhanaSection.display_groups).toHaveLength(15);
    expect(subuhanaSection.display_groups.map((group: any) => group.title)).toEqual([
      'Assalamu alaika',
      'Yanabi salam',
      'Salathu salamu huma sarmada',
      'Sallu ala hairil hibath',
      'Sallu binaabuh thimaamii',
      'Yamusthafa yamurthala',
      'Allahu halikuna',
      'Inna baithan antha shakinuhu',
      'Kullu sururi bidaabi shahril mouluthi',
      'Al hamthu illa hillathi anthaani',
      'Hihthi salaathi mahas salamis sarmathi',
      'Dua Sagheer',
      'Hubbun nabiee Alal insani muftharalu',
      'Dua Kabir',
      'Ilaihi thammin nahma alaina',
    ]);
    expect(subuhanaSection.display_groups.findIndex((group: any) => group.title === 'Dua Sagheer'))
      .toBeLessThan(subuhanaSection.display_groups.findIndex(
        (group: any) => group.title === 'Hubbun nabiee Alal insani muftharalu'
      ));
    expect(subuhanaSection.display_groups.flatMap((group: any) => group.verse_ids).sort()).toEqual(
      subuhanaSection.verse_ids.slice().sort()
    );
    const previousClosingPart = mawlid.duas.find((dua: any) =>
      dua.arabic.includes('وَمُغِيْثِ النَّاسِ مِنَ الْوَهَجِ')
    );
    const closingPartIndex = subuhanaSection.verse_ids.indexOf(previousClosingPart.id);
    const firstContinuationPart = mawlid.duas.find((dua: any) =>
      dua.id === subuhanaSection.verse_ids[closingPartIndex + 1]
    );
    expect(firstContinuationPart.arabic).toContain('صَلَوَاتُ اللهِ بِكُلِّ فَمِ');
    const finalSubuhanaPart = mawlid.duas.find((dua: any) => dua.id === subuhanaSection.verse_ids.at(-1));
    expect(finalSubuhanaPart.arabic).toContain('تَـــــــــمَّـــــــــتْ');
    expect(subuhana.translation_status).toMatch(/machine-drafted; human review required/i);
    for (const dua of [manqoos, ashrakal, ...mawlid.duas.filter((dua: any) => dua.section_id === 'subuhana-mawlid')]) {
      expect(Object.values(dua.translation).every(value => typeof value === 'string' && value.trim())).toBe(true);
    }
  });

  it('shows all Subuhana stanzas together with buttons that jump to each stanza', () => {
    render(<App />);
    openSection('mawlid');
    fireEvent.click(document.querySelector('[data-collection-id="subuhana-mawlid"]')!);
    const groups = subuhanaSource.display_groups;
    expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent)).toEqual(
      groups.map((group: any) => group.title)
    );
    const navigation = screen.getByRole('navigation', { name: 'Subuhana Mawlid sections' });
    expect(navigation.className).toContain('overflow-x-auto');
    expect(navigation.className).toContain('flex-nowrap');
    expect(within(navigation).getAllByRole('button').map(button => button.textContent)).toEqual(
      groups.map((group: any) => group.title)
    );
    expect(screen.getAllByRole('article')).toHaveLength(subuhanaSource.parts.length);
    expect(document.body.textContent).toContain(subuhanaSource.parts[0].arabic);
    expect(document.body.textContent).toContain(subuhanaSource.parts[7].arabic);
    expect(document.body.textContent).toContain(subuhanaSource.parts.at(-1).arabic);

    const targetGroup = groups.find((group: any) => group.title === 'Inna baithan antha shakinuhu');
    const builtSection = cats.find(category => category.id === 'mawlid')
      .sections.find((section: any) => section.id === 'subuhana-mawlid');
    const targetGroupId = builtSection.display_groups.find((group: any) => group.title === targetGroup.title).id;
    expect(document.getElementById(targetGroupId)).toBeTruthy();
    const originalScrollTo = window.scrollTo;
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    try {
      fireEvent.click(within(navigation).getByRole('button', { name: targetGroup.title }));
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
      const targetTop = document.getElementById(targetGroupId)!.getBoundingClientRect().top;
      const headerHeight = document.querySelector('.app-header')!.getBoundingClientRect().height;
      expect(scrollTo.mock.calls[0][0].top).toBe(targetTop + window.scrollY - headerHeight - 16);
    } finally {
      window.scrollTo = originalScrollTo;
    }
  });

  it('lets readers hide and show Subuhana translations', () => {
    render(<App />);
    openSection('mawlid');
    fireEvent.click(document.querySelector('[data-collection-id="subuhana-mawlid"]')!);
    expect(document.body.textContent).toContain('A small prayer');
    fireEvent.click(screen.getByRole('button', { name: 'Hide translations' }));
    expect(document.body.textContent).not.toContain('A small prayer');
    expect(document.body.textContent).toContain('دُعَاءٌ صَغِيْرٌ');
    fireEvent.click(screen.getByRole('button', { name: 'Show translations' }));
    expect(document.body.textContent).toContain('A small prayer');
  });
});

describe('every category opens, every dua opens, every button works', () => {
  for (const cat of cats) {
    it(`category ${cat.id}`, () => {
      render(<App />);
      openCategory(cat.id);
      expect(document.body.textContent!.length).toBeGreaterThan(50);
      // open each dua in regular categories
      const dc = Array.from(document.querySelectorAll('.dua-card'));
      for (let i = 0; i < Math.min(dc.length, 60); i++) {
        const cards = Array.from(document.querySelectorAll('.dua-card'));
        if (!cards[i]) break;
        fireEvent.click(cards[i]);
        for (const b of screen.queryAllByRole('button')) {
          if (/back|retour|العودة|geri|kembali|واپس/i.test(b.textContent || '')) continue;
          try { fireEvent.click(b); } catch (e) { errors.push('click threw ' + cat.id + ' ' + b.textContent + ' ' + e); }
        }
        // close any modal then go back
        const cancel = screen.queryAllByRole('button').find(x => /cancel|close/i.test(x.textContent || ''));
        if (cancel) fireEvent.click(cancel);
        back();
      }
      expect(errors.filter(e => !/act\(|not wrapped/i.test(e))).toEqual([]);
    });
  }
});

describe('languages', () => {
  for (const l of data.languages) {
    it(`renders in ${l.code}`, () => {
      render(<App />);
      const sel = screen.getAllByRole('button').find(b => (b.textContent || '').includes(data.languages[0].name));
      expect(sel).toBeTruthy();
      fireEvent.click(sel!);
      const opt = screen.getAllByRole('button').find(b => (b.textContent || '').includes(l.name) && b !== sel);
      if (opt) fireEvent.click(opt);
      const card = document.querySelector('.category-card'); fireEvent.click(card!);
      const d = document.querySelector('.dua-card'); if (d) fireEvent.click(d);
      expect(errors.filter(e => !/act\(/i.test(e))).toEqual([]);
    });
  }
});

describe('search', () => {
  const q = (v: string) => { const i = document.querySelector('input[type=text]') as HTMLInputElement; fireEvent.change(i, { target: { value: v } }); };
  it('finds duas by english word', () => { render(<App />); q('forgive'); expect(screen.getByText(/Dua results \((\d+)\)/).textContent).not.toMatch(/\(0\)/); });
  it('finds by arabic without harakat', () => { render(<App />); q('بسم الله'); expect(screen.getByText(/Dua results \((\d+)\)/).textContent).not.toMatch(/\(0\)/); });
  it('does not match serialized JavaScript object text', () => { render(<App />); q('[object Object]'); expect(screen.getByText(/Dua results \((\d+)\)/).textContent).toMatch(/\(0\)/); });
  it('finds by reference text', () => { render(<App />); q('Bukhari'); expect(screen.getByText(/Dua results \((\d+)\)/).textContent).not.toMatch(/\(0\)/); });
  it('finds Subuhana entries by their group heading', () => {
    render(<App />);
    q('Ilaihi thammin');
    expect(screen.getByText('Dua results (1)')).toBeTruthy();
    expect(document.body.textContent).toContain('Subuhana Mawlid');
  });
  it('finds Subuhana entries by their translation while inside Mawlid', () => {
    render(<App />);
    openCategory('mawlid');
    q('May God complete the blessings upon us');
    expect(screen.getByText('Dua results (1)')).toBeTruthy();
    expect(document.querySelector('.dua-card')?.textContent).toContain('May God complete the blessings upon us');
  });
  it('nonsense gives zero and clear works', () => { render(<App />); q('zzzqqq'); expect(screen.getByText(/No duas found/)).toBeTruthy(); fireEvent.click(screen.getByText('Clear')); expect(document.querySelector('.category-card')).toBeTruthy(); });
  it('clicking a result opens the dua', () => { render(<App />); q('forgive'); const r = document.querySelector('.dua-card')!; fireEvent.click(r); expect(screen.getAllByRole('button').length).toBeGreaterThan(3); });
});

describe('bookmarks', () => {
  it('survives corrupted localStorage', () => { localStorage.setItem('bookmarks', '{not json'); expect(() => render(<App />)).not.toThrow(); });
});
