import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { assetSrcSet, assetUrl } from './asset-url.js';
import defaultSite from './content/site.json' with { type: 'json' };
import defaultScience from './content/science.json' with { type: 'json' };
import defaultMusic from './content/music.json' with { type: 'json' };
import defaultHobbies from './content/hobbies.json' with { type: 'json' };
import defaultVideos from './videos.json' with { type: 'json' };
import defaultMedia from './media.generated.json' with { type: 'json' };
import { formatDuration, parseVideoSource } from './video-utils.js';
import { AdminEditor } from './AdminEditor.jsx';
import { AdminLockScreen } from './AdminLockScreen.jsx';
import './admin.css';

const ContentContext = createContext({
  site: defaultSite,
  science: { ...defaultScience, photos: defaultMedia.science || [] },
  music: { ...defaultMusic, photos: defaultMedia.music || [], videos: defaultVideos.music || [] },
  exploration: {
    ...defaultHobbies,
    categories: (defaultHobbies.categories || []).map((cat) => ({
      ...cat,
      photos: defaultMedia[cat.id] || [],
    })),
    gallery: defaultMedia.diving || [],
    videos: defaultVideos.diving || [],
  },
  videos: defaultVideos,
  media: defaultMedia,
});

function useContent() {
  return useContext(ContentContext);
}

function LotusFlowerIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4 C10.5 7.5 10 12 12 17.5 C14 12 13.5 7.5 12 4 Z" fill="currentColor" fillOpacity="0.22" />
      <path d="M12 17.5 C9 14 7.2 10 8.8 7 C10.2 8.5 11.2 12.5 12 17.5 Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M12 17.5 C15 14 16.8 10 15.2 7 C13.8 8.5 12.8 12.5 12 17.5 Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M12 17.5 C7 16 3 12.8 4.5 9.5 C6.8 10.5 9.5 13.8 12 17.5 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 17.5 C17 16 21 12.8 19.5 9.5 C17.2 10.5 14.5 13.8 12 17.5 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M2.5 17.5 C6 16.5 9.5 17 12 18.5 C14.5 17 18 16.5 21.5 17.5 C18 20 14 20 12 20 C10 20 6 20 2.5 17.5 Z" fill="currentColor" fillOpacity="0.24" />
    </svg>
  );
}

function getInitialPage() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'admin' || hash.startsWith('admin/') || window.location.pathname.endsWith('/admin')) return 'admin';
  if (hash === 'contact' || hash === 'about') return 'about';
  return defaultSite.pages.some((page) => page.id === hash) ||
    defaultHobbies.categories.some((category) => category.route === hash)
    ? hash
    : 'home';
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const params = new URLSearchParams(window.location.search);
    const queryTheme = params.get('theme');
    if (queryTheme === 'dark' || queryTheme === 'light') return queryTheme;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) {}
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [lightbox, setLightbox] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [activeDraft, setActiveDraft] = useState(() => {
    try {
      const saved = localStorage.getItem('lian_website_draft_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('lian_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const effectiveContent = useMemo(() => {
    const site = activeDraft?.site || defaultSite;
    const scienceRaw = activeDraft?.science || defaultScience;
    const musicRaw = activeDraft?.music || defaultMusic;
    const hobbiesRaw = activeDraft?.hobbies || defaultHobbies;
    const media = activeDraft?.media || defaultMedia;
    const videos = activeDraft?.videos || defaultVideos;

    const science = {
      ...scienceRaw,
      photos: media.science || [],
    };

    const music = {
      ...musicRaw,
      photos: media.music || [],
      videos: videos.music || [],
    };

    const exploration = {
      ...hobbiesRaw,
      categories: (hobbiesRaw.categories || []).map((cat) => ({
        ...cat,
        photos: media[cat.id] || [],
      })),
      gallery: media.diving || [],
      videos: videos.diving || [],
    };

    return { site, science, music, exploration, videos, media };
  }, [activeDraft]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e) => {
      try {
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      } catch (err) {}
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  useEffect(() => {
    const onHashChange = () => setActivePage(getInitialPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (activePage === 'admin') {
      document.title = `Visual Editor | ${effectiveContent.site.profile.preferredName}`;
    } else {
      document.title = `${effectiveContent.site.pages.find((page) => page.id === activePage)?.label ?? 'Portfolio'} | ${effectiveContent.site.profile.preferredName}`;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activePage, effectiveContent]);

  const allGalleryItems = useMemo(
    () => [
      ...effectiveContent.science.photos,
      ...effectiveContent.music.photos,
      ...effectiveContent.exploration.categories.flatMap((category) => category.photos),
    ],
    [effectiveContent],
  );

  function navigate(pageId) {
    window.location.hash = pageId === 'home' ? '' : pageId;
    setActivePage(pageId);
  }

  function openLightbox(item, items = allGalleryItems) {
    setLightbox({ item, items });
  }

  function closeLightbox() {
    setLightbox(null);
  }

  function selectLightboxItem(item) {
    setLightbox((current) => (current ? { ...current, item } : current));
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (activePage === 'admin') {
          navigate('home');
        } else {
          navigate('admin');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage]);

  if (activePage === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <AdminLockScreen
          expectedHash={effectiveContent.site.adminPasswordHash}
          onUnlock={() => setIsAdminAuthenticated(true)}
          onCancel={() => navigate('home')}
        />
      );
    }

    return (
      <AdminEditor
        initialSite={defaultSite}
        initialScience={defaultScience}
        initialMusic={defaultMusic}
        initialHobbies={defaultHobbies}
        initialVideos={defaultVideos}
        initialMedia={defaultMedia}
        onApplyDraft={(draft) => setActiveDraft(draft)}
        onExit={() => navigate('home')}
        onLock={() => {
          try {
            sessionStorage.removeItem('lian_admin_authenticated');
          } catch {}
          setIsAdminAuthenticated(false);
          navigate('home');
        }}
      />
    );
  }

  return (
    <ContentContext.Provider value={effectiveContent}>
      <div className="site-shell">
        {activeDraft && activePage !== 'admin' && (
          <aside className="draft-preview-bar" aria-label="Draft preview notification">
            <span>✏️ Viewing Draft Content (Not Published)</span>
            <div className="draft-preview-actions">
              <button type="button" className="draft-bar-btn edit" onClick={() => navigate('admin')}>
                Return to Editor
              </button>
              <button
                type="button"
                className="draft-bar-btn discard"
                onClick={() => {
                  localStorage.removeItem('lian_website_draft_v1');
                  setActiveDraft(null);
                }}
              >
                Discard Draft
              </button>
            </div>
          </aside>
        )}
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header
          activePage={activePage}
          onNavigate={navigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main id="main" tabIndex="-1">
          {activePage === 'home' && <Home onNavigate={navigate} />}
          {activePage === 'science' && <Science onOpen={openLightbox} />}
          {activePage === 'music' && (
            <Music onOpen={openLightbox} onOpenVideo={(video) => setVideoModal(video)} />
          )}
          {activePage === 'exploration' && <Exploration onNavigate={navigate} />}
          {activePage.startsWith('hobbies/') && (
            <HobbyGallery
              activePage={activePage}
              onNavigate={navigate}
              onOpen={openLightbox}
              onOpenVideo={(video) => setVideoModal(video)}
            />
          )}
          {activePage === 'about' && <About />}
        </main>
        <Footer onNavigate={navigate} />
        {lightbox && (
          <Lightbox
            item={lightbox.item}
            items={lightbox.items}
            onClose={closeLightbox}
            onSelect={selectLightboxItem}
          />
        )}
        {videoModal && (
          <VideoLightbox video={videoModal} onClose={() => setVideoModal(null)} />
        )}
      </div>
    </ContentContext.Provider>
  );
}

function Header({ activePage, onNavigate, theme, onToggleTheme }) {
  const { site } = useContent();
  const profile = site.profile;
  const pages = site.pages;

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="Go to home page">
        <span className="brand-mark" aria-hidden="true">
          LW
        </span>
        <span>
          <span className="brand-name">{profile.preferredName}</span>
          <span className="brand-title">{profile.title}</span>
        </span>
      </button>
      <nav aria-label="Primary navigation">
        {pages.map((page) => (
          <button
            className={
              activePage === page.id || (page.id === 'exploration' && activePage.startsWith('hobbies/'))
                ? 'nav-link is-active'
                : 'nav-link'
            }
            type="button"
            key={page.id}
            onClick={() => onNavigate(page.id)}
          >
            {page.label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <svg
            className="theme-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg
            className="theme-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </header>
  );
}

function Home({ onNavigate }) {
  const { site } = useContent();
  const profile = site.profile;
  const homeAbout = site.homeAbout;
  const educationTimeline = site.educationTimeline;
  const navigationCards = site.navigationCards;
  const containerRef = useRef(null);

  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    if (typeof IntersectionObserver === 'undefined') {
      rootEl.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = rootEl.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-container" ref={containerRef}>
      {/* 1. Hero / Personal Introduction */}
      <section className="home-band home-hero-band" aria-labelledby="home-heading">
        <div className="home-hero-inner">
          <div className="home-minimal-intro reveal-on-scroll">
            <p className="eyebrow">{homeAbout.eyebrow}</p>
            <h1 className="home-name" id="home-heading">
              <span>{homeAbout.headline}</span>
              <span>{homeAbout.chineseName}</span>
            </h1>
            <p className="home-subtitle">{homeAbout.subtitle}</p>
          </div>

          <div className="home-story reveal-on-scroll" aria-label="Lian Wang introduction">
            {homeAbout.story.map((paragraph, index) => (
              <p key={index}>{formatScientificText(paragraph)}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Research, Pipa Playing, and Hobbies Navigation Cards */}
      <section className="home-band home-cards-band" aria-labelledby="explore-heading">
        <div className="home-band-inner">
          <div className="section-heading reveal-on-scroll">
            <p className="eyebrow">Start Here</p>
            <h2 id="explore-heading">Selected Portfolios</h2>
            <p className="section-subheading">{profile.intro}</p>
          </div>

          <div className="home-cards-grid">
            {navigationCards.map((card, idx) => (
              <button
                key={card.page}
                type="button"
                className="home-nav-card reveal-on-scroll"
                style={{ '--stagger': idx }}
                onClick={() => onNavigate(card.page)}
                aria-label={`Explore ${card.title} - ${card.description}`}
              >
                <div className="nav-card-media">
                  <img
                    src={assetUrl(card.image)}
                    alt={card.alt || card.title}
                    loading="lazy"
                    className="nav-card-image"
                  />
                  <span className="nav-card-kicker">{card.kicker}</span>
                </div>
                <div className="nav-card-body">
                  <div className="nav-card-title-row">
                    <h3 className="nav-card-title">{card.title}</h3>
                    <span className="nav-card-arrow" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                  <p className="nav-card-desc">
                    {formatScientificText(card.description)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Academic Journey / Education */}
      <section className="home-band home-education-band" aria-labelledby="education-heading">
        <div className="home-band-inner">
          <div className="section-heading reveal-on-scroll">
            <p className="eyebrow">Education</p>
            <h2 id="education-heading">Academic Journey</h2>
          </div>

          <div className="academic-timeline-container reveal-on-scroll">
            <div className="academic-timeline-rail" aria-hidden="true" />
            <ol className="academic-timeline-list">
              {educationTimeline.map((item, idx) => (
                <li
                  key={item.institution || item.title || idx}
                  className="academic-timeline-item reveal-on-scroll"
                  style={{ '--stagger': idx }}
                >
                  <div className="timeline-marker" aria-hidden="true">
                    <span className="timeline-node" />
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <div className="timeline-institution-row">
                        <strong className="timeline-institution">
                          {item.institution || item.place}
                        </strong>
                        <span className="timeline-pipe">|</span>
                        <span className="timeline-period">{item.period}</span>
                      </div>
                      <h3 className="timeline-degree">{item.title}</h3>
                      <p className="timeline-place">{item.place}</p>
                      {item.honors && (
                        <span className="timeline-honors">{item.honors}</span>
                      )}
                    </div>
                    <p className="timeline-detail">
                      {formatScientificText(item.detail)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 4. Moments Along the Way Photo Mosaic (Hidden until ready) */}
      {site.showMoments && (
        <section className="home-band home-moments-band" aria-labelledby="moments-heading">
          <div className="home-band-inner">
            <div className="section-heading reveal-on-scroll">
              <p className="eyebrow">Moments Along the Way</p>
              <h2 id="moments-heading">Life Beyond the Bench</h2>
              <p className="section-subheading">
                A collection of moments from the lab, the stage, and places I&apos;ve explored.
              </p>
            </div>

            <div className="moments-mosaic">
              {(site.moments || []).map((moment, idx) => (
                <div
                  key={moment.id || idx}
                  className={`moment-card ${moment.spanClass || ''} reveal-on-scroll`}
                  style={{ '--stagger': idx }}
                  tabIndex="0"
                  role="figure"
                  aria-label={`${moment.title}: ${moment.caption}`}
                >
                  <div className="moment-media">
                    <img
                      src={assetUrl(moment.image)}
                      alt={moment.alt || moment.title}
                      loading="lazy"
                      className="moment-image"
                    />
                    <div className="moment-overlay">
                      <div className="moment-caption-wrap">
                        <span className="moment-category">{moment.category}</span>
                        <h3 className="moment-title">{moment.title}</h3>
                        <p className="moment-caption">{formatScientificText(moment.caption)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Closing: Let's Connect */}
      <section className="home-band home-connect-band" aria-labelledby="connect-heading">
        <div className="home-band-inner home-connect-inner">
          <div className="home-connect-card reveal-on-scroll">
            <p className="connect-eyebrow">Let&apos;s Connect</p>
            <h2 id="connect-heading" className="connect-title">
              Curious minds, shared conversations.
            </h2>
            <p className="connect-description">
              Whether it&apos;s about cell biology, microscopy, music, or something entirely different, I enjoy exchanging ideas and learning from people with different perspectives.
            </p>
            <div className="connect-actions">
              <a href={`mailto:${profile.email}`} className="connect-btn connect-btn-primary">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Contact</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatScientificText(text) {
  if (!text || typeof text !== 'string') return text;

  const sciRegex = /(Caenorhabditis elegans|C\. elegans|LON-1|lam-3|UNC-52|TLN-1|TLN-1\(W387A\)|NPxY|RGD|RGE|delta-RGD)/g;

  function renderSci(str, keyPrefix) {
    const subParts = str.split(sciRegex);
    return subParts.map((sub, i) =>
      sciRegex.test(sub) ? <em key={`${keyPrefix}-${i}`}>{sub}</em> : sub
    );
  }

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', label: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  if (parts.length === 0) return renderSci(text, 'txt-0');

  return parts.map((part, index) => {
    if (part.type === 'link') {
      return (
        <a
          key={`link-${index}`}
          href={part.url}
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          {renderSci(part.label, `link-label-${index}`)}
          <span className="external-link-arrow" aria-hidden="true"> ↗</span>
        </a>
      );
    }
    return renderSci(part.value, `txt-${index}`);
  });
}

function renderAuthors(authors) {
  if (!authors) return null;
  const parts = authors.split(/(Lianzijun Wang|L\. Wang)/g);
  return parts.map((part, index) => {
    if (part === 'Lianzijun Wang' || part === 'L. Wang') {
      return (
        <strong key={index} className="author-highlight">
          {part}
        </strong>
      );
    }
    return part;
  });
}

function Science({ onOpen }) {
  const { science } = useContent();

  return (
    <PageLayout
      eyebrow={science.eyebrow}
      title={science.title}
      intro={formatScientificText(science.intro)}
    >
      {/* 2B: Model Organism */}
      <section className="science-section" aria-labelledby="model-organism-heading">
        <div className="science-editorial-grid">
          <div className="science-editorial-copy">
            <div className="section-heading compact-heading">
              <p className="eyebrow">{science.modelOrganism.eyebrow}</p>
              <h2 id="model-organism-heading">
                Meet <em>C. elegans</em>
              </h2>
            </div>
            {science.modelOrganism.paragraphs.map((p, idx) => (
              <p key={idx}>{formatScientificText(p)}</p>
            ))}
            <div className="science-callout">
              <span className="science-callout-label">Model Advantage</span>
              <p>
                Optical transparency and a fully mapped cell lineage allow non-invasive, subcellular
                live-cell imaging throughout developmental progression.
              </p>
            </div>
          </div>
          <div className="science-editorial-media">
            {science.modelOrganism.image ? (
              <figure className="science-media-card">
                <button
                  type="button"
                  onClick={() =>
                    onOpen({
                      src: science.modelOrganism.image,
                      title: 'C. elegans in vivo',
                      caption: science.modelOrganism.caption,
                    })
                  }
                  aria-label="Open C. elegans microscopy image"
                >
                  <img src={assetUrl(science.modelOrganism.image)} alt="C. elegans microscopy" loading="lazy" />
                </button>
                <figcaption>
                  <strong><em>C. elegans</em></strong>
                  {science.modelOrganism.caption && <span>{science.modelOrganism.caption}</span>}
                  {science.modelOrganism.attribution && <small>{science.modelOrganism.attribution}</small>}
                </figcaption>
              </figure>
            ) : (
              <div className="science-media-slot" role="region" aria-label="C. elegans media location">
                <div className="slot-visual" aria-hidden="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3a9 9 0 0 0 0 18M12 3a9 9 0 0 1 0 18" strokeDasharray="2 2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="slot-badge">Media Location Ready</span>
                </div>
                <div className="slot-info">
                  <strong>Microscopy & Specimen Photography</strong>
                  <p>
                    Prepared for <em>C. elegans</em> fluorescence or DIC photography.
                  </p>
                  <code className="slot-path">public/media/science/anchor-cell/microscopy/</code>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2C: Anchor Cell Invasion */}
      <section className="science-section anchor-cell-section" aria-labelledby="anchor-cell-heading">
        <div className="anchor-cell-intro">
          <div className="section-heading compact-heading">
            <p className="eyebrow">{science.anchorCell.eyebrow}</p>
            <h2 id="anchor-cell-heading">{science.anchorCell.title}</h2>
          </div>
          <div className="anchor-cell-copy">
            {science.anchorCell.paragraphs.map((p, idx) => (
              <p key={idx}>{formatScientificText(p)}</p>
            ))}
            <div className="anchor-cell-actions">
              <a
                href="https://sites.duke.edu/sherwoodlab/"
                target="_blank"
                rel="noopener noreferrer"
                className="button-link-secondary anchor-cell-lab-btn"
              >
                <span>Sherwood Lab at Duke University</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Microscopy figure immediately following introductory text */}
        {science.anchorCell.microscopy?.src && (
          <figure className="anchor-cell-figure">
            <div
              className="anchor-cell-scroll-wrapper"
              tabIndex="0"
              role="region"
              aria-label="Anchor cell invasion microscopy timecourse (scroll horizontally on smaller screens)"
            >
              <button
                type="button"
                className="anchor-cell-media-button"
                onClick={() =>
                  onOpen({
                    src: science.anchorCell.microscopy.src,
                    title: science.anchorCell.microscopy.title || 'Watching cells cross a tissue barrier',
                    caption: (
                      <>
                        <strong>Watching cells cross a tissue barrier.</strong> During{' '}
                        <em>C. elegans</em> development, the anchor cell (magenta) breaches
                        the basement membrane (green), creating an opening that connects the
                        developing uterine and vulval tissues.
                      </>
                    ),
                    alt:
                      science.anchorCell.microscopy.alt ||
                      'Microscopy timecourse across five developmental stages showing the Caenorhabditis elegans anchor cell (magenta) breaching the basement membrane (green)',
                  })
                }
                aria-label="Open anchor cell invasion timecourse in full resolution"
                title="Click to view full-resolution microscopy timecourse"
              >
                <img
                  src={assetUrl(science.anchorCell.microscopy.src)}
                  alt={
                    science.anchorCell.microscopy.alt ||
                    'Microscopy timecourse across five developmental stages showing the Caenorhabditis elegans anchor cell (magenta) breaching the basement membrane (green)'
                  }
                  loading="lazy"
                  className="anchor-cell-microscopy-img"
                />
              </button>
            </div>
            <span className="anchor-cell-scroll-hint" aria-hidden="true">
              Scroll horizontally to explore all 5 stages →
            </span>
            <figcaption className="anchor-cell-caption">
              <p>
                <strong>{science.anchorCell.microscopy.captionLead || 'Watching cells cross a tissue barrier.'}</strong>{' '}
                {formatScientificText(science.anchorCell.microscopy.caption)}
              </p>
              {science.anchorCell.microscopy.attribution && (
                <small className="anchor-cell-attribution">
                  {formatScientificText(science.anchorCell.microscopy.attribution)}
                </small>
              )}
            </figcaption>
          </figure>
        )}

        {/* Schematic section */}
        {science.anchorCell.schematic?.src && (
          <figure className="science-media-card anchor-cell-schematic-card">
            <button
              type="button"
              onClick={() =>
                onOpen({
                  src: science.anchorCell.schematic.src,
                  title: science.anchorCell.schematic.title,
                  caption: science.anchorCell.schematic.caption,
                })
              }
              aria-label="Open anchor cell invasion schematic"
            >
              <img
                src={assetUrl(science.anchorCell.schematic.src)}
                alt={science.anchorCell.schematic.title}
                loading="lazy"
              />
            </button>
            <figcaption>
              <strong>{science.anchorCell.schematic.title}</strong>
              <span>{science.anchorCell.schematic.caption}</span>
              {science.anchorCell.schematic.attribution && (
                <small>{science.anchorCell.schematic.attribution}</small>
              )}
              {science.anchorCell.schematic.pdfUrl && (
                <a
                  className="button-link-secondary"
                  href={assetUrl(science.anchorCell.schematic.pdfUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download PDF Schematic
                </a>
              )}
            </figcaption>
          </figure>
        )}
      </section>

      {/* 2E: Publications */}
      <section className="science-section" aria-labelledby="publications-heading">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Published Work</p>
          <h2 id="publications-heading">Publications</h2>
          <p className="section-subtext">
            Verified peer-reviewed papers, preprints, and micropublications with full-text downloads and journal links.
          </p>
        </div>
        <div className="publications-vertical-list">
          {science.publishedWorks.map((work) => (
            <article className="pub-card" key={work.id}>
              {work.figure?.src && (
                <div className="pub-card-thumb">
                  <button
                    type="button"
                    className="pub-thumb-trigger"
                    onClick={() =>
                      onOpen({
                        src: work.figure.src,
                        title: work.title,
                        caption: work.figure.caption || work.summary,
                        alt: work.figure.alt || work.title,
                      })
                    }
                    title="Click to view full figure"
                    aria-label={`View figure for ${work.title}`}
                  >
                    <img
                      src={assetUrl(work.figure.src)}
                      alt={work.figure.alt || work.title}
                      loading="lazy"
                    />
                    <span className="pub-thumb-badge" aria-hidden="true">Figure</span>
                  </button>
                </div>
              )}
              <div className="pub-card-content">
                <div className="pub-card-meta">
                  <span className="pub-year-badge">{work.year}</span>
                  <span className="pub-venue">{work.venue}</span>
                </div>
                <h3 className="pub-title">{formatScientificText(work.title)}</h3>
                <p className="pub-authors">{renderAuthors(work.authors)}</p>
                <p className="pub-summary">{formatScientificText(work.summary)}</p>
                <div className="pub-actions">
                  {work.journalUrl && (
                    <a className="button-link" href={work.journalUrl} target="_blank" rel="noreferrer">
                      <span>{work.journalLabel || 'View Paper'}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                  {work.pdfUrl && (
                    <a className="button-link-secondary" href={assetUrl(work.pdfUrl)} download>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <polyline points="9 15 12 18 15 15" />
                      </svg>
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {science.photos.length > 0 && (
        <PhotoPrintGrid items={science.photos} onOpen={(item) => onOpen(item, science.photos)} />
      )}
    </PageLayout>
  );
}

function Music({ onOpen, onOpenVideo }) {
  const { music, videos } = useContent();
  const portrait = music.photos[0];
  const musicVideos = videos.music || [];

  return (
    <PageLayout eyebrow="Music" title="Pipa, performance, and listening notes" intro={music.overview}>
      <section className="pipa-feature">
        <button type="button" onClick={() => onOpen(portrait)} aria-label={`Open ${portrait.title} image`}>
          <img src={assetUrl(portrait.src)} alt={portrait.alt} loading="lazy" />
        </button>
        <div className="pipa-copy">
          <p>{music.pipaIntro}</p>
          <p>{music.personalNote}</p>
        </div>
      </section>
      {music.photos.length > 1 && (
        <PhotoPrintGrid items={music.photos.slice(1)} onOpen={(item) => onOpen(item, music.photos)} />
      )}
      {musicVideos.length > 0 && (
        <section className="music-video-section" aria-label="Pipa performance recordings">
          <div className="section-intro">
            <span className="eyebrow">Recordings</span>
            <h2>Performances & Video Recordings</h2>
          </div>
          <div className="video-grid">
            {musicVideos.map((video) => (
              <VideoCard key={video.id || video.title} video={video} onPlay={onOpenVideo} />
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  );
}

function Exploration({ onNavigate }) {
  const { exploration } = useContent();

  return (
    <PageLayout eyebrow="Hobbies" title="Hobbies" intro={exploration.overview}>
      <div className="hobby-category-grid">
        {exploration.categories.map((category) => (
          <article
            className={category.photos.length ? 'hobby-category' : 'hobby-category is-empty'}
            key={category.id}
          >
            <div className="hobby-category-visual">
              <button
                type="button"
                className="hobby-stack-button"
                onClick={() => onNavigate(category.route)}
                aria-label={`Open ${category.title} gallery`}
              >
                <PhotoStack photos={category.photos.slice(0, 5)} label={category.title} />
              </button>
            </div>
            <div className="hobby-category-header">
              <span className="meta-line">{category.subtitle}</span>
              <h2 className="hobby-category-heading">
                <button
                  type="button"
                  className="hobby-heading-button"
                  onClick={() => onNavigate(category.route)}
                >
                  {category.title}
                </button>
              </h2>
            </div>
            <p className="hobby-category-desc">{category.description}</p>
            <div className="hobby-category-footer">
              <button
                type="button"
                className="hobby-explore-btn"
                onClick={() => onNavigate(category.route)}
              >
                <span>
                  {category.photos.length
                    ? `Explore Gallery (${category.photos.length})`
                    : 'Explore Gallery'}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </PageLayout>
  );
}

function HobbyGallery({ activePage, onNavigate, onOpen, onOpenVideo }) {
  const { exploration, videos } = useContent();
  const category = exploration.categories.find((item) => item.route === activePage);

  if (!category) return null;

  const categoryVideos = videos[category.id] || [];

  return (
    <PageLayout eyebrow="Hobbies" title={category.title} intro={category.description}>
      <button className="back-link" type="button" onClick={() => onNavigate('exploration')}>
        Back to Hobbies
      </button>
      {category.photos.length ? (
        <PhotoPrintGrid items={category.photos} onOpen={(item) => onOpen(item, category.photos)} />
      ) : (
        <section className="empty-gallery" aria-label={`${category.title} gallery is ready for photos`}>
          <PhotoStack photos={[]} label={category.title} />
          <p>Photos for this gallery can be added in the central Hobbies data file.</p>
        </section>
      )}
      {categoryVideos.length > 0 && (
        <section className="hobby-video-section" aria-label={`${category.title} video footage`}>
          <div className="section-intro">
            <span className="eyebrow">Footage</span>
            <h2>Videos & Footage</h2>
          </div>
          <div className="hobby-video-grid">
            {categoryVideos.map((video) => (
              <VideoCard key={video.id} video={video} onPlay={onOpenVideo} />
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  );
}

function PhotoStack({ photos, label }) {
  const stack = photos.length ? photos : Array.from({ length: 4 }, (_, index) => ({ title: `${label} placeholder ${index + 1}` }));

  return (
    <span className="photo-stack" aria-hidden="true">
      {stack.slice(0, 5).map((photo, index) => (
        <span className={photos.length ? 'photo-stack-print' : 'photo-stack-print is-blank'} key={photo.title}>
          {(photo.thumb || photo.src) && (
            <img
              src={assetUrl(photo.thumb ?? photo.src)}
              srcSet={assetSrcSet(photo.srcSet)}
              sizes="(max-width: 520px) 28vw, 176px"
              alt=""
              loading="lazy"
            />
          )}
        </span>
      ))}
    </span>
  );
}

function PhotoPrintGrid({ items, onOpen }) {
  return (
    <div className="print-gallery">
      {items.map((item, index) => (
        <figure className="print-photo" key={item.title} style={{ '--turn': `${(index % 7) - 3}deg` }}>
          <button type="button" onClick={() => onOpen(item)} aria-label={`Open ${item.title}`}>
            <img
              src={assetUrl(item.thumb ?? item.src)}
              srcSet={assetSrcSet(item.srcSet)}
              sizes={item.sizes ?? '(max-width: 640px) 92vw, (max-width: 1100px) 45vw, 30vw'}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.closest('.print-photo')?.classList.add('has-image-error');
              }}
            />
            <span className="image-loading">Loading</span>
          </button>
          <figcaption>
            <strong>{item.title}</strong>
            {item.caption && <span>{item.caption}</span>}
            {item.location && <span>{item.location}</span>}
            {item.date && <span>{item.date}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function VideoCard({ video, onPlay }) {
  const parsed = parseVideoSource(video);
  const duration = formatDuration(video.duration);
  const fallbackYt = parsed.provider === 'youtube' && parsed.id ? `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg` : '';
  const thumbUrl = assetUrl(video.thumb || video.poster) || fallbackYt;

  return (
    <article className={`video-card ${parsed.isPlayable ? 'is-playable' : 'is-pending'}`} key={video.id}>
      <div className="video-card-media">
        {parsed.isPlayable ? (
          <button
            type="button"
            className="video-play-button"
            onClick={() => onPlay(video)}
            aria-label={`Play ${video.title}`}
          >
            <img src={thumbUrl} alt="" loading="lazy" decoding="async" />
            <span className="video-play-badge" aria-hidden="true">
              <span className="video-play-icon">▶</span>
              {duration && <span className="video-duration">{duration}</span>}
            </span>
          </button>
        ) : (
          <div className="video-pending-poster">
            <img src={thumbUrl} alt="" loading="lazy" decoding="async" />
            <span className="video-pending-badge">Hosted video coming soon</span>
          </div>
        )}
      </div>
      <div className="video-card-body">
        <div className="video-card-meta">
          {video.category && <span className="video-tag">{video.category}</span>}
          {video.location && <span className="video-location">{video.location}</span>}
          {video.date && <span className="video-date">{video.date}</span>}
        </div>
        <h3 className="video-card-title">
          {parsed.isPlayable ? (
            <button
              type="button"
              className="video-title-button"
              onClick={() => onPlay(video)}
            >
              {video.title}
            </button>
          ) : (
            video.title
          )}
        </h3>
        {video.description && <p className="video-card-description">{video.description}</p>}
        {parsed.watchUrl && (
          <div className="video-card-actions">
            <a
              className="video-external-link"
              href={parsed.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on {parsed.providerLabel} ↗
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

function VideoLightbox({ video, onClose }) {
  const parsed = parseVideoSource(video);
  const duration = formatDuration(video.duration);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="video-lightbox lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
    >
      <button
        className="lightbox-close"
        type="button"
        onClick={onClose}
        aria-label="Close video player"
      >
        Close
      </button>
      <div className="video-lightbox-content" onClick={(event) => event.stopPropagation()}>
        <div className="video-player-container">
          {parsed.provider === 'youtube' && (
            <iframe
              title={video.title}
              src={parsed.embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
          {parsed.provider === 'vimeo' && (
            <iframe
              title={video.title}
              src={parsed.embedUrl}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
          {(parsed.provider === 'custom' || parsed.provider === 'local' || parsed.provider === 'external' || parsed.provider === 'r2') && (
            <video
              controls
              autoPlay
              playsInline
              preload="metadata"
              poster={assetUrl(video.poster)}
              src={parsed.embedUrl}
            >
              <source src={parsed.embedUrl} type={video.type || 'video/mp4'} />
              {parsed.embedUrl.toLowerCase().includes('.mov') && (
                <source src={parsed.embedUrl} type="video/quicktime" />
              )}
              Your browser does not support HTML5 video playback.
            </video>
          )}
        </div>
        <div className="video-lightbox-caption">
          <div className="video-lightbox-header">
            <h3>{video.title}</h3>
            {parsed.watchUrl && (
              <a
                className="button-link video-watch-button"
                href={parsed.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch on {parsed.providerLabel} ↗
              </a>
            )}
          </div>
          {video.description && <p>{video.description}</p>}
          <div className="video-lightbox-meta">
            {video.location && <span>📍 {video.location}</span>}
            {video.date && <span>📅 {video.date}</span>}
            {duration && <span>⏱ {duration}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function About() {
  const { site } = useContent();
  const profile = site.profile;
  const chineseName = site.homeAbout?.chineseName || '王莲子君';

  return (
    <section className="content-page contact-page">
      <div className="page-intro">
        <p className="eyebrow">Contact/CV</p>
        <h1>{profile.name}</h1>
      </div>
      <section className="cv-preview" aria-label="CV PDF preview">
        <iframe src={assetUrl(profile.cvPath)} title={`${profile.name} CV PDF preview`} />
        <p className="cv-preview-fallback-text">
          If the preview does not load, use the download link below.
        </p>
      </section>
      <section className="contact-footnote-card" aria-label="Contact and Profiles">
        <div className="contact-card-brand">
          <div className="contact-card-brand-line">
            <span className="contact-card-name">{profile.preferredName}</span>
            <span className="contact-card-cn">{chineseName}</span>
            <span className="contact-lotus-motif" aria-hidden="true" title="莲 · Lotus">
              <LotusFlowerIcon size={20} />
            </span>
          </div>
          <p className="contact-card-tagline">
            {profile.title} · {profile.affiliation}
          </p>
          <p className="contact-card-location">{profile.location}</p>
        </div>

        <div className="contact-card-links">
          {profile.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card-link"
            >
              {link.label}
              <span className="contact-link-arrow" aria-hidden="true"> ↗</span>
            </a>
          ))}
          <a href={`mailto:${profile.email}`} className="contact-card-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            {profile.email}
          </a>
          <a
            className="contact-card-link contact-card-link-primary"
            href={assetUrl(profile.cvPath)}
            download
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CV
          </a>
        </div>
      </section>
    </section>
  );
}

function PageLayout({ eyebrow, title, intro, children }) {
  return (
    <section className="content-page">
      <div className="page-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children}
    </section>
  );
}

function Gallery({ items, onOpen, showScale = false }) {
  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <article className="gallery-item" key={item.title}>
          <button type="button" onClick={() => onOpen(item)} aria-label={`Open ${item.title} image`}>
            <img src={assetUrl(item.src)} alt={item.alt} loading="lazy" />
            {item.replaceable !== false && <span className="replaceable-tag">replaceable</span>}
          </button>
          <div className="gallery-caption">
            <h3>{item.title}</h3>
            <p>{item.caption}</p>
            {showScale && <p className="scale-line">{item.scale}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function ListSection({ title, items }) {
  return (
    <section className="list-section">
      <h2>{title}</h2>
      <div className="list-stack">
        {items.map((item) => (
          <article className="list-item" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Lightbox({ item, items, onClose, onSelect }) {
  const [touchStart, setTouchStart] = useState(null);
  const index = items.findIndex((candidate) => candidate.src === item.src);
  const canBrowse = items.length > 1 && index >= 0;

  function showNext() {
    if (canBrowse) onSelect(items[(index + 1) % items.length]);
  }

  function showPrevious() {
    if (canBrowse) onSelect(items[(index - 1 + items.length) % items.length]);
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') showNext();
      if (event.key === 'ArrowLeft') showPrevious();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [item, items, onClose, onSelect]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const distance = event.changedTouches[0].clientX - touchStart;
        if (Math.abs(distance) > 48) {
          if (distance < 0) showNext();
          if (distance > 0) showPrevious();
        }
        setTouchStart(null);
      }}
    >
      <button className="lightbox-close" type="button" onClick={onClose}>
        Close
      </button>
      {canBrowse && (
        <>
          <button className="lightbox-nav lightbox-prev" type="button" onClick={(event) => { event.stopPropagation(); showPrevious(); }} aria-label="Previous photo">
            ‹
          </button>
          <button className="lightbox-nav lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); showNext(); }} aria-label="Next photo">
            ›
          </button>
        </>
      )}
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={assetUrl(item.src)} alt={item.alt} decoding="async" />
        <figcaption>
          <strong>{item.title}</strong>
          {item.caption && <span>{item.caption}</span>}
          {item.location && <span>{item.location}</span>}
          {item.date && <span>{item.date}</span>}
          {item.scale && <span>{item.scale}</span>}
        </figcaption>
      </figure>
    </div>
  );
}

function Footer({ onNavigate }) {
  const { site } = useContent();
  const profile = site.profile;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-col">
          <div className="footer-brand-line">
            <span className="footer-name">{profile.preferredName}</span>
            <span className="footer-cn-name">{site.homeAbout?.chineseName || '王莲子君'}</span>
            <span className="footer-lotus-motif" aria-hidden="true" title="莲 · Lotus">
              <LotusFlowerIcon size={20} />
            </span>
          </div>
          <p className="footer-tagline">
            {profile.title} · {profile.affiliation}
          </p>
        </div>

        <div className="footer-links-col">
          <div className="footer-nav-links">
            {profile.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {link.label}
                <span className="footer-link-arrow" aria-hidden="true"> ↗</span>
              </a>
            ))}
            <a href={`mailto:${profile.email}`} className="footer-link">
              {profile.email}
            </a>
          </div>
          <p className="footer-copyright">
            © {currentYear} {profile.name}. All rights reserved.
            {onNavigate && (
              <>
                {' · '}
                <button
                  type="button"
                  className="footer-editor-link"
                  onClick={() => onNavigate('admin')}
                  title="Open Protected Visual Editor"
                >
                  Editor
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default App;
