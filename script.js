// Phulka: Dhaba Cooking Game - Interactive Script & Store Attribution Engine
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. Header shadow on scroll
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  // 3. Smart App Store & Play Store Attribution + Outbound Signal Tracking
  const htmlLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1] || 'index.html';
  const pageSlug = lastSegment.endsWith('.html')
    ? lastSegment.replace(/\.html$/i, '')
    : 'index';
  const campaignId = `${htmlLang}_${pageSlug}`.replace(/[^a-z0-9_-]/gi, '_').slice(0, 40);

  const decorateStoreUrl = (rawHref) => {
    try {
      const url = new URL(rawHref, window.location.href);
      if (url.hostname.includes('apps.apple.com')) {
        if (!url.searchParams.has('ct')) {
          url.searchParams.set('pt', 'phulka');
          url.searchParams.set('ct', campaignId);
          url.searchParams.set('mt', '8');
        }
        return { decorated: url.toString(), store: 'ios_app_store' };
      }
      if (url.hostname.includes('testflight.apple.com')) {
        url.searchParams.set('ct', campaignId);
        return { decorated: url.toString(), store: 'ios_testflight' };
      }
      if (url.hostname.includes('play.google.com')) {
        if (!url.searchParams.has('referrer')) {
          const ref = `utm_source=phulka_website&utm_medium=seo_landing&utm_campaign=${campaignId}&utm_content=${htmlLang}`;
          url.searchParams.set('referrer', ref);
        }
        return { decorated: url.toString(), store: 'google_play' };
      }
    } catch (_) {
      // Ignore malformed URLs
    }
    return null;
  };

  const recordStoreClickSignal = (store, targetUrl) => {
    try {
      const key = 'phulka_store_signals';
      const existing = JSON.parse(localStorage.getItem(key) || '{"clicks":[],"counts":{}}');
      const bucket = `${store}:${campaignId}`;
      existing.counts[bucket] = (existing.counts[bucket] || 0) + 1;
      existing.clicks.push({
        ts: new Date().toISOString(),
        lang: htmlLang,
        page: pageSlug,
        campaign: campaignId,
        store,
        targetUrl,
      });
      if (existing.clicks.length > 50) existing.clicks = existing.clicks.slice(-50);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {
      // Ignore storage quota / privacy mode restrictions
    }
  };

  window.getPhulkaStoreSignals = () => {
    try {
      return JSON.parse(localStorage.getItem('phulka_store_signals') || '{"clicks":[],"counts":{}}');
    } catch (_) {
      return { clicks: [], counts: {} };
    }
  };

  document.querySelectorAll('a[href]').forEach(anchor => {
    const info = decorateStoreUrl(anchor.getAttribute('href'));
    if (!info) return;
    anchor.setAttribute('href', info.decorated);
    anchor.setAttribute('data-store-campaign', campaignId);
    anchor.setAttribute('data-store-target', info.store);
    anchor.addEventListener('click', () => {
      recordStoreClickSignal(info.store, info.decorated);
    });
  });

  // 4. Screenshot Lightbox
  const screenshotItems = document.querySelectorAll('.screenshot-item');
  if (screenshotItems.length > 0) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-backdrop';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Screenshot Preview');
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close preview">&times;</button>
        <img class="lightbox-img" src="" alt="Game screenshot preview">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    const openLightbox = (src, caption) => {
      lightboxImg.src = src;
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    screenshotItems.forEach(item => {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const caption = item.querySelector('.screenshot-caption')?.textContent;
        if (img) {
          openLightbox(img.src, caption);
        }
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }
});
