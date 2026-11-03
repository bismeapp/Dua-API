import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFPageProxy,
  type RenderTask,
} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({
  page,
  width,
  scrollRoot,
  onRendered,
  onError,
}: {
  page: PDFPageProxy;
  width: number;
  scrollRoot: HTMLDivElement | null;
  onRendered: (pageNumber: number) => void;
  onError: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { root: scrollRoot, rootMargin: '100% 0px' },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isNearViewport || width < 1) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / baseViewport.width });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      onError();
      return;
    }

    canvas.width = Math.ceil(viewport.width * outputScale);
    canvas.height = Math.ceil(viewport.height * outputScale);
    let renderTask: RenderTask | undefined;

    try {
      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      });
      renderTask.promise
        .then(() => onRendered(page.pageNumber))
        .catch(error => {
          if (error?.name !== 'RenderingCancelledException') onError();
        });
    } catch {
      onError();
    }

    return () => renderTask?.cancel();
  }, [isNearViewport, onError, onRendered, page, width]);

  const pageSize = page.getViewport({ scale: 1 });

  return (
    <div
      ref={wrapperRef}
      className="mx-auto w-full bg-white"
      style={{ aspectRatio: `${pageSize.width} / ${pageSize.height}` }}
    >
      <canvas
        ref={canvasRef}
        aria-label={`PDF page ${page.pageNumber}`}
        className="block h-full w-full"
      />
    </div>
  );
}

export default function RathibPdfViewer({
  src,
  title = 'Rathib PDF',
  onBack,
}: {
  src: string;
  title?: string;
  onBack: () => void;
}) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [pageWidth, setPageWidth] = useState(0);
  const [hasRenderedFirstPage, setHasRenderedFirstPage] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = scrollRootRef.current;
    if (!container) return;

    setScrollRoot(container);
    const updateWidth = () => setPageWidth(Math.max(1, container.clientWidth));
    updateWidth();

    const supportsResizeObserver = typeof ResizeObserver !== 'undefined';
    if (!supportsResizeObserver) {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadingTask = getDocument({ url: src });
    setPages([]);
    setHasError(false);
    setHasRenderedFirstPage(false);

    const loadPages = async () => {
      try {
        const document = await loadingTask.promise;
        const loadedPages: PDFPageProxy[] = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          loadedPages.push(await document.getPage(pageNumber));
          if (cancelled) return;
        }
        if (loadedPages.length === 0) throw new Error('The PDF contains no pages.');
        if (!cancelled) setPages(loadedPages);
      } catch {
        if (!cancelled) setHasError(true);
      }
    };

    void loadPages();
    return () => {
      cancelled = true;
      void loadingTask.destroy().catch(() => {});
    };
  }, [src]);

  const handleRendered = useCallback((pageNumber: number) => {
    if (pageNumber === 1) setHasRenderedFirstPage(true);
  }, []);
  const handleRenderError = useCallback(() => setHasError(true), []);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--bisme-bg-primary)] text-[var(--bisme-text-primary)]">
      <header className="z-10 flex min-h-14 shrink-0 items-center border-b border-[var(--bisme-gold-border)] bg-[var(--bisme-bg-secondary)] px-3 py-2 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="category-back-button inline-flex min-h-10 items-center gap-2 rounded-[13px] border px-3 py-2 text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Back to Rathib</span>
        </button>
      </header>

      <div
        ref={scrollRootRef}
        className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[var(--bisme-bg-primary)]"
        aria-label={`${title} PDF pages`}
      >
        {hasError ? (
          <p role="alert" className="p-6 text-center text-[var(--bisme-text-primary)]">
            The PDF could not be displayed. Please check your connection and try again.
          </p>
        ) : (
          <>
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 p-2 sm:gap-4 sm:p-4">
              {pages.map(page => (
                <PdfPage
                  key={page.pageNumber}
                  page={page}
                  width={Math.min(pageWidth - (window.innerWidth >= 640 ? 32 : 16), 928)}
                  scrollRoot={scrollRoot}
                  onRendered={handleRendered}
                  onError={handleRenderError}
                />
              ))}
            </div>
            {!hasRenderedFirstPage && (
              <div
                role="status"
                className="absolute inset-0 top-14 flex items-center justify-center bg-[var(--bisme-bg-primary)] text-[var(--bisme-text-primary)]"
              >
                Loading {title}…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
