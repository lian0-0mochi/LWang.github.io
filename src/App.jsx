import { useEffect, useMemo, useState } from 'react';
import { assetSrcSet, assetUrl } from './asset-url.js';
import {
  educationTimeline,
  exploration,
  homeAbout,
  music,
  navigationCards,
  pages,
  profile,
  science,
} from './data.js';

function getInitialPage() {
  const hash = window.location.hash.replace('#', '');
  return pages.some((page) => page.id === hash) || exploration.categories.some((category) => category.route === hash)
    ? hash
    : 'home';
}

function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const onHashChange = () => setActivePage(getInitialPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = `${pages.find((page) => page.id === activePage)?.label ?? 'Portfolio'} | ${profile.preferredName}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activePage]);

  const allGalleryItems = useMemo(
    () => [
      ...science.publishedWorks.map((work) => ({
        src: work.figure.src,
        alt: work.figure.alt,
        title: work.shortTitle,
        caption: work.figure.caption,
      })),
      ...science.photos,
      ...music.photos,
      ...exploration.categories.flatMap((category) => category.photos),
    ],
    [],
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

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header activePage={activePage} onNavigate={navigate} />
      <main id="main" tabIndex="-1">
        {activePage === 'home' && <Home onNavigate={navigate} />}
        {activePage === 'science' && <Science onOpen={openLightbox} />}
        {activePage === 'music' && <Music onOpen={openLightbox} />}
        {activePage === 'exploration' && <Exploration onNavigate={navigate} />}
        {activePage.startsWith('hobbies/') && (
          <HobbyGallery activePage={activePage} onNavigate={navigate} onOpen={openLightbox} />
        )}
        {activePage === 'about' && <About />}
      </main>
      <Footer />
      {lightbox && (
        <Lightbox
          item={lightbox.item}
          items={lightbox.items}
          onClose={closeLightbox}
          onSelect={selectLightboxItem}
        />
      )}
    </div>
  );
}

function Header({ activePage, onNavigate }) {
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
            className={activePage === page.id || (page.id === 'exploration' && activePage.startsWith('hobbies/')) ? 'nav-link is-active' : 'nav-link'}
            type="button"
            key={page.id}
            onClick={() => onNavigate(page.id)}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Home({ onNavigate }) {
  return (
    <>
      <section className="home-minimal" aria-labelledby="home-heading">
        <div className="home-minimal-intro">
          <p className="eyebrow">{homeAbout.eyebrow}</p>
          <h1 className="home-name" id="home-heading">
            <span>{homeAbout.headline}</span>
            <span>{homeAbout.chineseName}</span>
          </h1>
          <p className="home-subtitle">{homeAbout.subtitle}</p>
        </div>

        <div className="home-story" aria-label="Lian Wang introduction">
          {homeAbout.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="page-band education-band" aria-labelledby="education-heading">
        <div className="section-heading">
          <p className="eyebrow">Education</p>
          <h2 id="education-heading">The path so far</h2>
        </div>
        <ol className="education-timeline">
          {educationTimeline.map((item) => (
            <li key={item.title}>
              <span>{item.period}</span>
              <div>
                <h3>{item.title}</h3>
                <p className="meta-line">{item.place}</p>
                <p>
                  {item.detail}
                  {item.honors && <><br />{item.honors}</>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="page-band">
        <div className="section-heading">
          <p className="eyebrow">Start here</p>
          <h2>{profile.intro}</h2>
        </div>
        <div className="home-tab-grid">
          {navigationCards.map((card) => (
            <button className="home-tab" type="button" key={card.page} onClick={() => onNavigate(card.page)}>
              <span>{card.kicker}</span>
              <strong>{card.title}</strong>
              <small>{card.description}</small>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function Science({ onOpen }) {
  const [activeWorkId, setActiveWorkId] = useState(science.publishedWorks[0].id);
  const activeWork =
    science.publishedWorks.find((work) => work.id === activeWorkId) ?? science.publishedWorks[0];

  return (
    <PageLayout eyebrow="Science" title="Published and ongoing work" intro={science.overview}>
      <section className="science-section" aria-labelledby="published-work-heading">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Published Work</p>
          <h2 id="published-work-heading">A timeline of papers</h2>
        </div>
        <div className="publication-shell">
          <div className="publication-timeline" role="tablist" aria-label="Published works timeline">
            {science.publishedWorks.map((work) => (
              <button
                className={work.id === activeWork.id ? 'timeline-tab is-active' : 'timeline-tab'}
                type="button"
                role="tab"
                aria-selected={work.id === activeWork.id}
                aria-controls={`paper-panel-${work.id}`}
                id={`paper-tab-${work.id}`}
                key={work.id}
                onClick={() => setActiveWorkId(work.id)}
              >
                <span>{work.year}</span>
                {work.shortTitle}
              </button>
            ))}
          </div>
          <article
            className="paper-panel"
            role="tabpanel"
            id={`paper-panel-${activeWork.id}`}
            aria-labelledby={`paper-tab-${activeWork.id}`}
          >
            <button
              className="paper-figure"
              type="button"
              onClick={() =>
                onOpen({
                  src: activeWork.figure.src,
                  alt: activeWork.figure.alt,
                  title: activeWork.shortTitle,
                  caption: activeWork.figure.caption,
                })
              }
              aria-label={`Open figure snapshot for ${activeWork.title}`}
            >
              <img src={assetUrl(activeWork.figure.src)} alt={activeWork.figure.alt} loading="lazy" />
              <span className="scale-line figure-label">{activeWork.figure.caption}</span>
            </button>
            <div className="paper-copy">
              <p className="meta-line">{activeWork.venue}</p>
              <h3>{activeWork.title}</h3>
              <p className="authors-line">{activeWork.authors}</p>
              <p>{activeWork.summary}</p>
              <div className="action-row">
                <a className="button-link" href={activeWork.journalUrl} target="_blank" rel="noreferrer">
                  {activeWork.journalLabel}
                </a>
                <a className="button-link" href={assetUrl(activeWork.pdfUrl)} download>
                  Download PDF
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>
      {science.photos.length > 0 && (
        <PhotoPrintGrid items={science.photos} onOpen={(item) => onOpen(item, science.photos)} />
      )}
    </PageLayout>
  );
}

function Music({ onOpen }) {
  const portrait = music.photos[0];

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
      <div className="video-grid">
        {music.videos.map((video) => (
          <article className="video-card" key={video.title}>
            {video.youtubeId && video.embed !== false ? (
              <iframe
                title={video.title}
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}${video.start ? `?start=${video.start}` : ''}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            ) : video.url ? (
              <a className="video-link-card" href={video.url} target="_blank" rel="noreferrer">
                <img src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" />
                <span>Watch on YouTube</span>
              </a>
            ) : (
              <div className="video-placeholder" role="img" aria-label="Replaceable YouTube embed placeholder">
                Add YouTube ID
              </div>
            )}
            <div>
              <h3>{video.title}</h3>
              <p>{video.description}</p>
            </div>
          </article>
        ))}
      </div>
    </PageLayout>
  );
}

function Exploration({ onNavigate }) {
  return (
    <PageLayout eyebrow="Hobbies" title="Hobbies" intro={exploration.overview}>
      <div className="hobby-category-grid">
        {exploration.categories.map((category) => (
          <button
            className={category.photos.length ? 'hobby-category' : 'hobby-category is-empty'}
            type="button"
            key={category.id}
            onClick={() => onNavigate(category.route)}
          >
            <PhotoStack photos={category.photos.slice(0, 5)} label={category.title} />
            <span className="hobby-category-copy">
              <span className="meta-line">{category.subtitle}</span>
              <strong>{category.title}</strong>
              <small>{category.description}</small>
            </span>
          </button>
        ))}
      </div>
    </PageLayout>
  );
}

function HobbyGallery({ activePage, onNavigate, onOpen }) {
  const category = exploration.categories.find((item) => item.route === activePage);

  if (!category) return null;

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
      {category.id === 'diving' && exploration.videos.length > 0 && <VideoStrip videos={exploration.videos} />}
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

function VideoStrip({ videos }) {
  return (
    <div className="hobby-video-strip">
      {videos.map((video) => {
        const playbackUrl = video.externalUrl || (import.meta.env.DEV ? assetUrl(video.localSrc) : '');
        return (
          <article className="hobby-video-card" key={video.id}>
            {video.youtubeId ? (
              <iframe
                title={video.title}
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            ) : playbackUrl ? (
              <video controls preload="metadata" poster={assetUrl(video.poster)}>
                <source src={playbackUrl} type={video.type ?? 'video/mp4'} />
              </video>
            ) : (
              <div className="hobby-video-pending">
                <img src={assetUrl(video.poster)} alt="" loading="lazy" />
                <p>Recording available soon.</p>
              </div>
            )}
            <h3>{video.title}</h3>
            <p>{video.caption}</p>
          </article>
        );
      })}
    </div>
  );
}

function About() {
  return (
    <section className="content-page">
      <div className="page-intro">
        <p className="eyebrow">About/CV</p>
        <h1>{profile.name}</h1>
      </div>
      <section className="cv-preview" aria-label="CV PDF preview">
        <iframe src={assetUrl(profile.cvPath)} title={`${profile.name} CV PDF preview`} />
        <p>
          If the preview does not load, use the download link below.
        </p>
      </section>
      <section className="text-panel about-contact-bottom">
        <h2>Contact</h2>
        <p>{profile.affiliation}</p>
        <p>{profile.location}</p>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <a className="button-link" href={assetUrl(profile.cvPath)} download>
          Download CV
        </a>
      </section>
      <section className="link-row" aria-label="Profile links">
        {profile.links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
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

function Footer() {
  return (
    <footer className="site-footer">
      <p>
        {profile.preferredName} | {profile.title}, {profile.affiliation}
      </p>
      <a href={`mailto:${profile.email}`}>{profile.email}</a>
    </footer>
  );
}

export default App;
