import * as pdfjsLib from 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';

const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
const trailerButton = document.querySelector('[data-trailer-button]');
const trailerMedia = document.querySelector('[data-trailer-media]');
const comicCards = document.querySelectorAll('[data-comic-card]');
const comicFrame = document.querySelector('[data-comic-frame]');
const comicTitle = document.querySelector('[data-comic-title]');
const comicDownload = document.querySelector('[data-comic-download]');
const comicViewer = document.getElementById('comic-viewer');

const formatFallbackTitle = (pdfPath, fallbackTitle) => {
  if (fallbackTitle) {
    return fallbackTitle;
  }

  const rawName = decodeURIComponent(pdfPath.split('/').pop() || 'Comic');
  const cleanName = rawName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\bdesconocido\b/gi, '')
    .trim();

  if (!cleanName) {
    return 'Comic Marvel';
  }

  return cleanName.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const resolveComicTitle = async (pdf, card) => {
  const fallbackTitle = formatFallbackTitle(card.dataset.pdf, card.dataset.fallbackTitle);

  try {
    const metadata = await pdf.getMetadata();
    const infoTitle = metadata?.info?.Title?.trim();
    const metaTitle = metadata?.metadata?.get?.('dc:title')?.trim();
    const title = infoTitle || metaTitle || fallbackTitle;

    return title && title.toLowerCase() !== 'untitled' ? title : fallbackTitle;
  } catch {
    return fallbackTitle;
  }
};

if (menuBtn && menu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('show');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('show');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

if (trailerButton && trailerMedia) {
  trailerButton.addEventListener('click', () => {
    if (trailerButton.classList.contains('is-playing')) {
      return;
    }

    const videoId = trailerButton.dataset.videoId;
    const iframe = document.createElement('iframe');

    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = 'Spider-Man Brand New Day trailer';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    trailerMedia.innerHTML = '';
    trailerMedia.appendChild(iframe);
    trailerButton.classList.add('is-playing');
  });
}

const setActiveComic = (card) => {
  const pdfPath = card.dataset.pdf;
  const title = card.dataset.title || formatFallbackTitle(pdfPath, card.dataset.fallbackTitle);

  comicCards.forEach((item) => item.classList.toggle('is-active', item === card));

  if (comicFrame) {
    comicFrame.src = `${pdfPath}#view=FitH`;
  }

  if (comicTitle) {
    comicTitle.textContent = title;
  }

  if (comicDownload) {
    comicDownload.href = pdfPath;
  }

  comicViewer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const renderComicCover = async (card) => {
  const pdfPath = card.dataset.pdf;
  const art = card.querySelector('[data-pdf-cover]');

  if (!pdfPath || !art) {
    return;
  }

  try {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdf = await loadingTask.promise;
    const resolvedTitle = await resolveComicTitle(pdf, card);
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.1 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const cardTitle = card.querySelector('[data-comic-card-title]');

    card.dataset.title = resolvedTitle;

    if (cardTitle) {
      cardTitle.textContent = resolvedTitle;
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    art.replaceChildren(canvas);
  } catch (error) {
    art.style.background = 'linear-gradient(135deg, rgba(145, 18, 35, 0.82), rgba(14, 16, 46, 0.92))';
    console.error('No se pudo renderizar la portada del PDF:', pdfPath, error);
  }
};

comicCards.forEach((card, index) => {
  renderComicCover(card);

  card.addEventListener('click', () => {
    setActiveComic(card);
  });

  if (index === 0) {
    card.classList.add('is-active');
  }
});
