import { vi } from 'vitest';
Object.defineProperty(window, 'matchMedia', { writable: true, value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null }) });
window.scrollTo = vi.fn() as any;
Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
(window as any).HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
(window as any).HTMLMediaElement.prototype.pause = vi.fn();
(window as any).HTMLMediaElement.prototype.load = vi.fn();
(window as any).speechSynthesis = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [], pause: vi.fn(), resume: vi.fn(), onvoiceschanged: null };
(window as any).SpeechSynthesisUtterance = function () {};
