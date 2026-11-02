import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import App from '../src/App';
import data from '../src/data/allData.json';

const errors: string[] = [];
beforeEach(() => {
  cleanup(); localStorage.clear(); window.history.replaceState(null, '', '/');
  errors.length = 0;
  vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a.map(String).join(' ').slice(0, 300)); });
});

const cats = data.categories as any[];
const back = () => { const b = screen.queryAllByRole('button').find(x => /back|retour|العودة|geri|kembali|واپس|ফিরে|திரும்பு|മടങ്ങ/i.test(x.textContent || '')); if (b) fireEvent.click(b); return !!b; };

describe('excluded content', () => {
  it('does not include Ruqyah or explicitly Shia-specific supplications', () => {
    const collection = JSON.stringify(data.categories);
    expect(collection).not.toMatch(/ruqyah|ruqya|رقية|الرقية/i);
    expect(collection).not.toMatch(/(?:saheefah|sahifa|sahifah).{0,30}(?:alaw|alavi)|kumayl|ziyarat.{0,20}ashura|mafatih al-jinan|sahifa sajjadiya/i);
  });
});

describe('Mawlid content', () => {
  it('keeps each mawlid whole and provides translations in every supported language', () => {
    const mawlid = cats.find(category => category.id === 'mawlid');
    expect(mawlid.duas).toHaveLength(2);
    const manqoos = mawlid.duas.find((dua: any) => dua.id === 'manqoos-mawlid-01');
    const ashrakal = mawlid.duas.find((dua: any) => dua.id === 'ashrakal-baith-01');
    expect(manqoos.title.en).toBe('Manqoos Mawlid');
    expect(manqoos.arabic.split('\n\n')).toHaveLength(18);
    expect(ashrakal.title.en).toBe('Ashrakal Baith');
    expect(ashrakal.arabic.match(/۞/g)).toHaveLength(36);
    expect(ashrakal.arabic).toContain('رَبَّنَا ارْحَمْنَا جَمِيعًا');
    for (const dua of [manqoos, ashrakal]) {
      expect(Object.values(dua.translation).every(value => typeof value === 'string' && value.trim())).toBe(true);
    }
  });
});

describe('every category opens, every dua opens, every button works', () => {
  for (const cat of cats) {
    it(`category ${cat.id}`, () => {
      render(<App />);
      const card = screen.getAllByRole('button').find(b => b.classList.contains('category-card') && (b.textContent || '').startsWith(cat.name.en));
      expect(card, 'card for ' + cat.id).toBeTruthy();
      fireEvent.click(card!);
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
  it('nonsense gives zero and clear works', () => { render(<App />); q('zzzqqq'); expect(screen.getByText(/No duas found/)).toBeTruthy(); fireEvent.click(screen.getByText('Clear')); expect(document.querySelector('.category-card')).toBeTruthy(); });
  it('clicking a result opens the dua', () => { render(<App />); q('forgive'); const r = document.querySelector('.dua-card')!; fireEvent.click(r); expect(screen.getAllByRole('button').length).toBeGreaterThan(3); });
});

describe('bookmarks', () => {
  it('survives corrupted localStorage', () => { localStorage.setItem('bookmarks', '{not json'); expect(() => render(<App />)).not.toThrow(); });
});
