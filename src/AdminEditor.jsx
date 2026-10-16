import React, { useState, useEffect } from 'react';
import { verifyGitHubAccess, commitFilesToBranch, createOrGetPullRequest } from './github-sync.js';
import { assetUrl } from './asset-url.js';
import { hashPasscode } from './auth-utils.js';

// Local storage key for drafts
const DRAFT_STORAGE_KEY = 'lian_website_draft_v1';
const GITHUB_TOKEN_KEY = 'lian_gh_editor_token';

function extractYoutubeId(url) {
  if (!url) return '';
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : '';
}

export function AdminEditor({
  initialSite,
  initialScience,
  initialMusic,
  initialHobbies,
  initialVideos,
  initialMedia,
  onApplyDraft,
  onExit,
  onLock,
}) {
  // State for all content domains
  const [site, setSite] = useState(initialSite);
  const [science, setScience] = useState(initialScience);
  const [music, setMusic] = useState(initialMusic);
  const [hobbies, setHobbies] = useState(initialHobbies);
  const [videos, setVideos] = useState(initialVideos);
  const [media, setMedia] = useState(initialMedia);

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('admin/')) {
      const tab = hash.split('/')[1];
      if (['home', 'about', 'science', 'music', 'hobbies', 'media', 'auth'].includes(tab)) {
        return tab;
      }
    }
    return 'home';
  });

  function selectTab(tab) {
    setActiveTab(tab);
    window.location.hash = `admin/${tab}`;
  }
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [prResult, setPrResult] = useState(null);

  // Authentication State
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [ghToken, setGhToken] = useState(() => localStorage.getItem(GITHUB_TOKEN_KEY) || '');
  const [authData, setAuthData] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  // Gallery editing category selection
  const [activeGalleryCategory, setActiveGalleryCategory] = useState('diving');

  // Passcode Management State
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState(null);

  // Load draft from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.site) setSite(draft.site);
        if (draft.science) setScience(draft.science);
        if (draft.music) setMusic(draft.music);
        if (draft.hobbies) setHobbies(draft.hobbies);
        if (draft.videos) setVideos(draft.videos);
        if (draft.media) setMedia(draft.media);
        setHasChanges(true);
        setStatusMessage({ type: 'info', text: 'Loaded your saved draft from this browser.' });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Validate GitHub Token on mount if present
  useEffect(() => {
    if (ghToken && !isLocalDev) {
      verifyToken(ghToken);
    }
  }, [ghToken, isLocalDev]);

  async function verifyToken(token) {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const info = await verifyGitHubAccess(token);
      setAuthData(info);
      localStorage.setItem(GITHUB_TOKEN_KEY, token);
      setStatusMessage({ type: 'success', text: `Authenticated as ${info.name || info.username}.` });
    } catch (err) {
      setAuthError(err.message);
      setAuthData(null);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setGhToken(tokenInput.trim());
    verifyToken(tokenInput.trim());
  }

  function handleSignOut() {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    setGhToken('');
    setAuthData(null);
    setStatusMessage({ type: 'info', text: 'Signed out of GitHub.' });
  }

  // Auto-save draft to localStorage whenever content changes
  function updateState(setter, updater) {
    setter((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setHasChanges(true);
      return next;
    });
  }

  // Persist current state to localStorage draft
  function saveDraftLocally() {
    const draft = { site, science, music, hobbies, videos, media };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    if (onApplyDraft) onApplyDraft(draft);
    setStatusMessage({
      type: 'success',
      text: 'Draft saved in your browser. Changes are ready to preview!',
    });
  }

  // Discard draft and revert to initial
  function discardDraft() {
    if (!window.confirm('Are you sure you want to discard your draft changes and restore published content?')) {
      return;
    }
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSite(initialSite);
    setScience(initialScience);
    setMusic(initialMusic);
    setHobbies(initialHobbies);
    setVideos(initialVideos);
    setMedia(initialMedia);
    setHasChanges(false);
    if (onApplyDraft) onApplyDraft(null);
    setStatusMessage({ type: 'info', text: 'Draft discarded. Published content restored.' });
  }

  // Save to disk in local development
  async function saveToLocalDisk() {
    setIsSaving(true);
    setStatusMessage({ type: 'info', text: 'Writing changes to local project files...' });
    try {
      const res = await fetch('/api/cms-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, science, music, hobbies, videos, media }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save to local files');

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasChanges(false);
      setStatusMessage({
        type: 'success',
        text: `✓ Saved successfully to local project files at ${new Date(data.timestamp).toLocaleTimeString()}!`,
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to save locally: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  }

  // Prepare file payload for GitHub API
  function getGitHubFilesPayload() {
    return [
      { path: 'src/content/site.json', content: JSON.stringify(site, null, 2) + '\n' },
      { path: 'src/content/science.json', content: JSON.stringify(science, null, 2) + '\n' },
      { path: 'src/content/music.json', content: JSON.stringify(music, null, 2) + '\n' },
      { path: 'src/content/hobbies.json', content: JSON.stringify(hobbies, null, 2) + '\n' },
      { path: 'src/videos.json', content: JSON.stringify(videos, null, 2) + '\n' },
      { path: 'src/media.generated.json', content: JSON.stringify(media, null, 2) + '\n' },
    ];
  }

  // Save to GitHub Draft Branch & Open Pull Request
  async function saveToGitHubDraft() {
    if (!ghToken) {
      setStatusMessage({ type: 'error', text: 'Please sign in with your GitHub token first.' });
      return;
    }
    setIsSaving(true);
    setPrResult(null);
    setStatusMessage({ type: 'info', text: 'Creating GitHub draft branch and commit...' });
    try {
      const branchName = 'cms-drafts';
      const commitRes = await commitFilesToBranch({
        token: ghToken,
        branch: branchName,
        baseBranch: 'main',
        files: getGitHubFilesPayload(),
        commitMessage: `Update website content draft via visual editor (${new Date().toLocaleDateString()})`,
      });

      setStatusMessage({ type: 'info', text: 'Commit created. Opening or updating Pull Request...' });

      const pr = await createOrGetPullRequest({
        token: ghToken,
        branch: branchName,
        baseBranch: 'main',
        title: 'CMS Content Draft: Website Updates',
        body: `### Website Content Updates via Visual Editor\n\n- Committed by: **${authData?.name || authData?.username || 'Admin'}**\n- Timestamp: ${new Date().toLocaleString()}\n- Target Branch: \`main\`\n\nReview the visual diff in GitHub and merge when ready to publish.`,
      });

      setPrResult(pr);
      setStatusMessage({
        type: 'success',
        text: `✓ Draft saved to branch '${branchName}' and Pull Request #${pr.number} is ready for review!`,
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: `GitHub draft error: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  }

  // Publish Directly to main (Optional Publish Now feature)
  async function publishDirectlyToMain() {
    if (!ghToken) {
      setStatusMessage({ type: 'error', text: 'Please sign in with your GitHub token first.' });
      return;
    }
    setIsSaving(true);
    setShowPublishConfirm(false);
    setStatusMessage({ type: 'info', text: 'Publishing directly to main branch...' });
    try {
      const commitRes = await commitFilesToBranch({
        token: ghToken,
        branch: 'main',
        baseBranch: 'main',
        files: getGitHubFilesPayload(),
        commitMessage: `Publish website content via visual editor (${new Date().toLocaleDateString()})`,
      });

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasChanges(false);
      setStatusMessage({
        type: 'success',
        text: `✓ Published successfully to main branch! GitHub Actions will deploy your website in ~1-2 minutes. (Commit: ${commitRes.commitSha.slice(0, 7)})`,
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Publish error: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  }

  function handlePreview() {
    saveDraftLocally();
    if (onExit) onExit();
  }

  return (
    <div className="admin-root">
      {/* Top Application Bar */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-badge">Visual Editor</span>
          <h2>Website Content Management</h2>
        </div>

        <div className="admin-actions">
          {isLocalDev && (
            <span className="admin-status-pill local">
              <span className="pill-dot"></span> Local Dev Server
            </span>
          )}
          {!isLocalDev && authData && (
            <span className="admin-status-pill github">
              <img src={authData.avatarUrl} alt="" className="admin-avatar-small" />
              {authData.username}
            </span>
          )}

          <button type="button" className="admin-btn secondary" onClick={handlePreview}>
            👁️ Preview Site
          </button>

          {hasChanges && (
            <button type="button" className="admin-btn text" onClick={discardDraft}>
              Discard Draft
            </button>
          )}

          {isLocalDev ? (
            <button
              type="button"
              className="admin-btn primary"
              onClick={saveToLocalDisk}
              disabled={isSaving}
            >
              💾 Save to Project Files
            </button>
          ) : (
            <>
              <button
                type="button"
                className="admin-btn primary"
                onClick={saveToGitHubDraft}
                disabled={isSaving || !authData}
                title={!authData ? 'Sign in with GitHub to save' : 'Save as a draft Pull Request on GitHub'}
              >
                📝 Save as GitHub Draft
              </button>

              <button
                type="button"
                className="admin-btn highlight"
                onClick={() => setShowPublishConfirm(true)}
                disabled={isSaving || !authData}
                title="Publish directly to main branch"
              >
                🚀 Publish Now
              </button>
            </>
          )}

          <button
            type="button"
            className="admin-btn outline"
            onClick={onLock || onExit}
            title="Lock editor session and return to site"
          >
            🔒 Lock & Exit
          </button>
        </div>
      </header>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className={`admin-alert ${statusMessage.type}`}>
          <span>{statusMessage.text}</span>
          {prResult && (
            <a
              href={prResult.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="admin-alert-link"
            >
              Open Pull Request #{prResult.number} on GitHub →
            </a>
          )}
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setStatusMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Admin Body */}
      <div className="admin-container">
        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'home' ? 'is-active' : ''}`}
              onClick={() => selectTab('home')}
            >
              <span>🏠</span> Home Page
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'about' ? 'is-active' : ''}`}
              onClick={() => selectTab('about')}
            >
              <span>👤</span> Contact & CV
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'science' ? 'is-active' : ''}`}
              onClick={() => selectTab('science')}
            >
              <span>🔬</span> Science & Papers
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'music' ? 'is-active' : ''}`}
              onClick={() => selectTab('music')}
            >
              <span>🎵</span> Music & Pipa
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'hobbies' ? 'is-active' : ''}`}
              onClick={() => selectTab('hobbies')}
            >
              <span>🌊</span> Hobbies & Galleries
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'media' ? 'is-active' : ''}`}
              onClick={() => selectTab('media')}
            >
              <span>🖼️</span> Media Library
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'auth' ? 'is-active' : ''}`}
              onClick={() => selectTab('auth')}
            >
              <span>🔒</span> GitHub Publishing
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <p className="admin-hint">
              Changes auto-save as browser drafts. Click <strong>Preview Site</strong> to verify your layout.
            </p>
          </div>
        </aside>

        {/* Content Tab Panes */}
        <main className="admin-main">
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Home Page Content</h2>
                <p>Edit the homepage hero, biography overview, name story, and section navigation cards.</p>
              </div>

              {/* Hero Banner */}
              <div className="admin-card">
                <h3>Hero Banner</h3>
                <div className="admin-form-group">
                  <label>Eyebrow Label</label>
                  <input
                    type="text"
                    value={site.hero.eyebrow}
                    onChange={(e) =>
                      updateState(setSite, (s) => ({
                        ...s,
                        hero: { ...s.hero, eyebrow: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Headline Title</label>
                  <input
                    type="text"
                    value={site.hero.headline}
                    onChange={(e) =>
                      updateState(setSite, (s) => ({
                        ...s,
                        hero: { ...s.hero, headline: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Introductory Paragraph</label>
                  <textarea
                    rows={3}
                    value={site.hero.body}
                    onChange={(e) =>
                      updateState(setSite, (s) => ({
                        ...s,
                        hero: { ...s.hero, body: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              {/* Name Origin Story */}
              <div className="admin-card">
                <h3>About Me & Name Origin Story</h3>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Headline</label>
                    <input
                      type="text"
                      value={site.homeAbout.headline}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          homeAbout: { ...s.homeAbout, headline: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Chinese Name</label>
                    <input
                      type="text"
                      value={site.homeAbout.chineseName}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          homeAbout: { ...s.homeAbout, chineseName: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={site.homeAbout.subtitle}
                    onChange={(e) =>
                      updateState(setSite, (s) => ({
                        ...s,
                        homeAbout: { ...s.homeAbout, subtitle: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Hometown Note</label>
                  <input
                    type="text"
                    value={site.homeAbout.hometownNote}
                    onChange={(e) =>
                      updateState(setSite, (s) => ({
                        ...s,
                        homeAbout: { ...s.homeAbout, hometownNote: e.target.value },
                      }))
                    }
                  />
                </div>

                <h4>Story Paragraphs</h4>
                {site.homeAbout.story.map((para, idx) => (
                  <div className="admin-list-item" key={idx}>
                    <span className="item-number">{idx + 1}</span>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateState(setSite, (s) => {
                          const updated = [...s.homeAbout.story];
                          updated[idx] = val;
                          return { ...s, homeAbout: { ...s.homeAbout, story: updated } };
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="admin-btn-icon delete"
                      title="Delete paragraph"
                      onClick={() =>
                        updateState(setSite, (s) => ({
                          ...s,
                          homeAbout: {
                            ...s.homeAbout,
                            story: s.homeAbout.story.filter((_, i) => i !== idx),
                          },
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-btn secondary small"
                  onClick={() =>
                    updateState(setSite, (s) => ({
                      ...s,
                      homeAbout: {
                        ...s.homeAbout,
                        story: [...s.homeAbout.story, ''],
                      },
                    }))
                  }
                >
                  + Add Story Paragraph
                </button>
              </div>

              {/* Navigation Cards */}
              <div className="admin-card">
                <h3>Homepage Quick Navigation Cards</h3>
                {site.navigationCards.map((card, idx) => (
                  <div className="admin-subcard" key={idx}>
                    <h4>Card {idx + 1}: {card.title}</h4>
                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setSite, (s) => {
                              const updated = [...s.navigationCards];
                              updated[idx] = { ...updated[idx], title: val };
                              return { ...s, navigationCards: updated };
                            });
                          }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Kicker / Number</label>
                        <input
                          type="text"
                          value={card.kicker}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setSite, (s) => {
                              const updated = [...s.navigationCards];
                              updated[idx] = { ...updated[idx], kicker: val };
                              return { ...s, navigationCards: updated };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={card.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setSite, (s) => {
                            const updated = [...s.navigationCards];
                            updated[idx] = { ...updated[idx], description: val };
                            return { ...s, navigationCards: updated };
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT & CV */}
          {activeTab === 'about' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Contact & CV Content</h2>
                <p>Manage your profile biography, contact links, education timeline, and CV sections.</p>
              </div>

              {/* Profile Bio */}
              <div className="admin-card">
                <h3>Personal Profile</h3>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={site.profile.name}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          profile: { ...s.profile, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Preferred Name</label>
                    <input
                      type="text"
                      value={site.profile.preferredName}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          profile: { ...s.profile, preferredName: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Academic Title</label>
                    <input
                      type="text"
                      value={site.profile.title}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          profile: { ...s.profile, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Affiliation</label>
                    <input
                      type="text"
                      value={site.profile.affiliation}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          profile: { ...s.profile, affiliation: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={site.profile.location}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          profile: { ...s.profile, location: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email Address</label>
                    <input
                      type="text"
                      value={site.profile.email}
                      onChange={(e) =>
                        updateState(setSite, (s) => ({
                          ...s,
                          profile: { ...s.profile, email: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Full Biography</label>
                  <textarea
                    rows={4}
                    value={site.profile.biography}
                    onChange={(e) =>
                      updateState(setSite, (s) => ({
                        ...s,
                        profile: { ...s.profile, biography: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              {/* Education Timeline */}
              <div className="admin-card">
                <h3>Education Timeline</h3>
                {site.educationTimeline.map((item, idx) => (
                  <div className="admin-subcard" key={idx}>
                    <div className="subcard-header">
                      <strong>Entry {idx + 1}: {item.title || 'Untitled'}</strong>
                      <button
                        type="button"
                        className="admin-btn-icon delete"
                        onClick={() =>
                          updateState(setSite, (s) => ({
                            ...s,
                            educationTimeline: s.educationTimeline.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Period</label>
                        <input
                          type="text"
                          value={item.period}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setSite, (s) => {
                              const updated = [...s.educationTimeline];
                              updated[idx] = { ...updated[idx], period: val };
                              return { ...s, educationTimeline: updated };
                            });
                          }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Degree / Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setSite, (s) => {
                              const updated = [...s.educationTimeline];
                              updated[idx] = { ...updated[idx], title: val };
                              return { ...s, educationTimeline: updated };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label>Institution / Department</label>
                      <input
                        type="text"
                        value={item.place}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setSite, (s) => {
                            const updated = [...s.educationTimeline];
                            updated[idx] = { ...updated[idx], place: val };
                            return { ...s, educationTimeline: updated };
                          });
                        }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Details & Research Focus</label>
                      <input
                        type="text"
                        value={item.detail}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setSite, (s) => {
                            const updated = [...s.educationTimeline];
                            updated[idx] = { ...updated[idx], detail: val };
                            return { ...s, educationTimeline: updated };
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-btn secondary small"
                  onClick={() =>
                    updateState(setSite, (s) => ({
                      ...s,
                      educationTimeline: [
                        ...s.educationTimeline,
                        { period: '', title: '', place: '', detail: '' },
                      ],
                    }))
                  }
                >
                  + Add Education Entry
                </button>
              </div>

              {/* CV Sections */}
              <div className="admin-card">
                <h3>CV Sections & Items</h3>
                {site.cvSections.map((sec, secIdx) => (
                  <div className="admin-subcard" key={secIdx}>
                    <h4>{sec.title}</h4>
                    {sec.items.map((item, itemIdx) => (
                      <div className="admin-list-item-block" key={itemIdx}>
                        <div className="admin-form-row">
                          <input
                            type="text"
                            placeholder="Heading / Award / Paper Title"
                            value={item.heading}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setSite, (s) => {
                                const sections = [...s.cvSections];
                                const items = [...sections[secIdx].items];
                                items[itemIdx] = { ...items[itemIdx], heading: val };
                                sections[secIdx] = { ...sections[secIdx], items };
                                return { ...s, cvSections: sections };
                              });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Year / Meta (e.g. 2026 | Duke)"
                            value={item.meta}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setSite, (s) => {
                                const sections = [...s.cvSections];
                                const items = [...sections[secIdx].items];
                                items[itemIdx] = { ...items[itemIdx], meta: val };
                                sections[secIdx] = { ...sections[secIdx], items };
                                return { ...s, cvSections: sections };
                              });
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Details / Description"
                          value={item.detail}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setSite, (s) => {
                              const sections = [...s.cvSections];
                              const items = [...sections[secIdx].items];
                              items[itemIdx] = { ...items[itemIdx], detail: val };
                              sections[secIdx] = { ...sections[secIdx], items };
                              return { ...s, cvSections: sections };
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCIENCE & PUBLICATIONS */}
          {activeTab === 'science' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Science & Research Publications</h2>
                <p>Edit biological descriptions and manage your peer-reviewed papers, preprints, and micropublications.</p>
              </div>

              {/* Research Overview */}
              <div className="admin-card">
                <h3>Research Introduction</h3>
                <div className="admin-form-group">
                  <label>Page Title</label>
                  <input
                    type="text"
                    value={science.title}
                    onChange={(e) =>
                      updateState(setScience, (s) => ({ ...s, title: e.target.value }))
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Introductory Summary</label>
                  <textarea
                    rows={3}
                    value={science.intro}
                    onChange={(e) =>
                      updateState(setScience, (s) => ({ ...s, intro: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Model Organism & Anchor Cell */}
              <div className="admin-card">
                <h3>Model Organism (C. elegans)</h3>
                <div className="admin-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={science.modelOrganism.title}
                    onChange={(e) =>
                      updateState(setScience, (s) => ({
                        ...s,
                        modelOrganism: { ...s.modelOrganism, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Description Paragraph</label>
                  <textarea
                    rows={4}
                    value={science.modelOrganism.paragraphs[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateState(setScience, (s) => ({
                        ...s,
                        modelOrganism: { ...s.modelOrganism, paragraphs: [val] },
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="admin-card">
                <h3>Biological Process (Anchor Cell Invasion)</h3>
                <div className="admin-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={science.anchorCell.title}
                    onChange={(e) =>
                      updateState(setScience, (s) => ({
                        ...s,
                        anchorCell: { ...s.anchorCell, title: e.target.value },
                      }))
                    }
                  />
                </div>
                {science.anchorCell.paragraphs.map((para, idx) => (
                  <div className="admin-form-group" key={idx}>
                    <label>Paragraph {idx + 1}</label>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateState(setScience, (s) => {
                          const updated = [...s.anchorCell.paragraphs];
                          updated[idx] = val;
                          return {
                            ...s,
                            anchorCell: { ...s.anchorCell, paragraphs: updated },
                          };
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Publications List Manager */}
              <div className="admin-card">
                <div className="subcard-header">
                  <h3>Published Works & Preprints ({science.publishedWorks.length})</h3>
                  <button
                    type="button"
                    className="admin-btn primary small"
                    onClick={() => {
                      const newId = `paper-${Date.now()}`;
                      updateState(setScience, (s) => ({
                        ...s,
                        publishedWorks: [
                          {
                            id: newId,
                            title: 'New Publication Title',
                            shortTitle: 'Short Title',
                            venue: 'Journal Name, Year',
                            year: String(new Date().getFullYear()),
                            authors: 'Lianzijun Wang',
                            summary: 'Summary of the paper and findings.',
                            journalLabel: 'View Article',
                            journalUrl: '',
                            pdfUrl: '',
                          },
                          ...s.publishedWorks,
                        ],
                      }));
                    }}
                  >
                    + Add New Publication
                  </button>
                </div>

                {science.publishedWorks.map((work, idx) => (
                  <div className="admin-pub-edit-card" key={work.id}>
                    <div className="pub-edit-header">
                      <span className="pub-badge">{work.year} · {work.venue}</span>
                      <div className="pub-edit-controls">
                        {idx > 0 && (
                          <button
                            type="button"
                            className="admin-btn-icon"
                            title="Move Up"
                            onClick={() => {
                              updateState(setScience, (s) => {
                                const list = [...s.publishedWorks];
                                const temp = list[idx - 1];
                                list[idx - 1] = list[idx];
                                list[idx] = temp;
                                return { ...s, publishedWorks: list };
                              });
                            }}
                          >
                            ↑
                          </button>
                        )}
                        {idx < science.publishedWorks.length - 1 && (
                          <button
                            type="button"
                            className="admin-btn-icon"
                            title="Move Down"
                            onClick={() => {
                              updateState(setScience, (s) => {
                                const list = [...s.publishedWorks];
                                const temp = list[idx + 1];
                                list[idx + 1] = list[idx];
                                list[idx] = temp;
                                return { ...s, publishedWorks: list };
                              });
                            }}
                          >
                            ↓
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-btn-icon delete"
                          title="Delete publication"
                          onClick={() => {
                            if (window.confirm(`Delete publication "${work.title}"?`)) {
                              updateState(setScience, (s) => ({
                                ...s,
                                publishedWorks: s.publishedWorks.filter((_, i) => i !== idx),
                              }));
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label>Paper Title</label>
                      <input
                        type="text"
                        value={work.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setScience, (s) => {
                            const list = [...s.publishedWorks];
                            list[idx] = { ...list[idx], title: val };
                            return { ...s, publishedWorks: list };
                          });
                        }}
                      />
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Venue (Journal / Preprint)</label>
                        <input
                          type="text"
                          value={work.venue}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setScience, (s) => {
                              const list = [...s.publishedWorks];
                              list[idx] = { ...list[idx], venue: val };
                              return { ...s, publishedWorks: list };
                            });
                          }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Year</label>
                        <input
                          type="text"
                          value={work.year}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setScience, (s) => {
                              const list = [...s.publishedWorks];
                              list[idx] = { ...list[idx], year: val };
                              return { ...s, publishedWorks: list };
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label>Authors (Full list, comma-separated)</label>
                      <input
                        type="text"
                        value={work.authors}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setScience, (s) => {
                            const list = [...s.publishedWorks];
                            list[idx] = { ...list[idx], authors: val };
                            return { ...s, publishedWorks: list };
                          });
                        }}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Paper Summary</label>
                      <textarea
                        rows={3}
                        value={work.summary}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setScience, (s) => {
                            const list = [...s.publishedWorks];
                            list[idx] = { ...list[idx], summary: val };
                            return { ...s, publishedWorks: list };
                          });
                        }}
                      />
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group" style={{ flex: 1 }}>
                        <label>Journal Button Text</label>
                        <input
                          type="text"
                          placeholder="e.g. Current Biology article page"
                          value={work.journalLabel || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setScience, (s) => {
                              const list = [...s.publishedWorks];
                              list[idx] = { ...list[idx], journalLabel: val };
                              return { ...s, publishedWorks: list };
                            });
                          }}
                        />
                      </div>
                      <div className="admin-form-group" style={{ flex: 2 }}>
                        <label>Journal / DOI URL</label>
                        <input
                          type="text"
                          placeholder="https://doi.org/..."
                          value={work.journalUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setScience, (s) => {
                              const list = [...s.publishedWorks];
                              list[idx] = { ...list[idx], journalUrl: val };
                              return { ...s, publishedWorks: list };
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label>PDF Download Source (Local Path or External URL)</label>
                      <input
                        type="text"
                        placeholder="/publications/.../paper.pdf or https://..."
                        value={work.pdfUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setScience, (s) => {
                            const list = [...s.publishedWorks];
                            list[idx] = { ...list[idx], pdfUrl: val };
                            return { ...s, publishedWorks: list };
                          });
                        }}
                      />
                      <span className="admin-field-hint">
                        To update the PDF, point to a local file in <code>public/publications/</code> (e.g. <code>/publications/2025.mitochondria-invasion/pdf/accepted-current-biology.pdf</code>), provide a direct external PDF link, or drop your new PDF into the project.
                      </span>
                    </div>

                    <div className="admin-form-group">
                      <label>Paper Figure Thumbnail Image</label>
                      <div className="admin-video-thumb-row">
                        <div className="admin-video-thumb-preview">
                          {work.figure?.src ? (
                            <img
                              src={assetUrl(work.figure.src)}
                              alt="Figure preview"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                            />
                          ) : (
                            <span className="no-thumb-label">No Figure</span>
                          )}
                        </div>
                        <div className="admin-video-thumb-controls">
                          <input
                            type="text"
                            placeholder="/media/science/.../figure1.png or image URL"
                            value={work.figure?.src || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setScience, (s) => {
                                const list = [...s.publishedWorks];
                                list[idx] = {
                                  ...list[idx],
                                  figure: {
                                    ...(list[idx].figure || {}),
                                    src: val,
                                  },
                                };
                                return { ...s, publishedWorks: list };
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MUSIC & PIPA */}
          {activeTab === 'music' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Music & Pipa Performance</h2>
                <p>Manage performance notes, instrument history, and YouTube performance video links.</p>
              </div>

              <div className="admin-card">
                <h3>Pipa Story & Overview</h3>
                <div className="admin-form-group">
                  <label>Section Overview</label>
                  <input
                    type="text"
                    value={music.overview}
                    onChange={(e) =>
                      updateState(setMusic, (m) => ({ ...m, overview: e.target.value }))
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Pipa History & Background</label>
                  <textarea
                    rows={4}
                    value={music.pipaIntro}
                    onChange={(e) =>
                      updateState(setMusic, (m) => ({ ...m, pipaIntro: e.target.value }))
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Personal Reflection & Mountain Portrait Note</label>
                  <textarea
                    rows={3}
                    value={music.personalNote}
                    onChange={(e) =>
                      updateState(setMusic, (m) => ({ ...m, personalNote: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Music Videos */}
              <div className="admin-card">
                <div className="subcard-header">
                  <h3>Pipa Videos ({(videos.music || []).length})</h3>
                  <button
                    type="button"
                    className="admin-btn primary small"
                    onClick={() => {
                      const newVideo = {
                        id: `music-video-${Date.now()}`,
                        title: 'New Pipa Performance',
                        description: 'Performance description',
                        category: 'music',
                        location: 'Durham, NC',
                        date: String(new Date().getFullYear()),
                        externalUrl: '',
                        hostedUrl: '',
                        poster: '/media/music/pipa-portrait-01.jpeg',
                        thumb: '/media/music/pipa-portrait-01.jpeg',
                        status: 'published',
                      };
                      updateState(setVideos, (v) => ({
                        ...v,
                        music: [...(v.music || []), newVideo],
                      }));
                    }}
                  >
                    + Add Video Link
                  </button>
                </div>

                {(videos.music || []).map((vid, idx) => {
                  const currentUrl = vid.externalUrl || vid.hostedUrl || '';
                  const ytId = vid.youtubeId || extractYoutubeId(currentUrl);
                  const currentThumb = vid.poster || vid.thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');

                  return (
                    <div className="admin-subcard" key={vid.id || idx}>
                      <div className="subcard-header">
                        <strong>Video {idx + 1}: {vid.title || 'Untitled Performance'}</strong>
                        <button
                          type="button"
                          className="admin-btn-icon delete"
                          onClick={() => {
                            updateState(setVideos, (v) => ({
                              ...v,
                              music: v.music.filter((_, i) => i !== idx),
                            }));
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="admin-form-row">
                        <div className="admin-form-group" style={{ flex: 2 }}>
                          <label>Video Title</label>
                          <input
                            type="text"
                            value={vid.title || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setVideos, (v) => {
                                const list = [...(v.music || [])];
                                list[idx] = { ...list[idx], title: val };
                                return { ...v, music: list };
                              });
                            }}
                          />
                        </div>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                          <label>Date</label>
                          <input
                            type="text"
                            placeholder="e.g. 2024"
                            value={vid.date || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setVideos, (v) => {
                                const list = [...(v.music || [])];
                                list[idx] = { ...list[idx], date: val };
                                return { ...v, music: list };
                              });
                            }}
                          />
                        </div>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                          <label>Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Durham, NC"
                            value={vid.location || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setVideos, (v) => {
                                const list = [...(v.music || [])];
                                list[idx] = { ...list[idx], location: val };
                                return { ...v, music: list };
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label>YouTube / Video URL</label>
                        <input
                          type="text"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={currentUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const detectedYt = extractYoutubeId(val);
                            updateState(setVideos, (v) => {
                              const list = [...(v.music || [])];
                              list[idx] = {
                                ...list[idx],
                                externalUrl: val,
                                hostedUrl: val,
                                ...(detectedYt ? { youtubeId: detectedYt } : {}),
                              };
                              return { ...v, music: list };
                            });
                          }}
                        />
                      </div>

                      {/* Video Thumbnail / Poster Customization */}
                      <div className="admin-form-group">
                        <label>Thumbnail / Poster Picture</label>
                        <div className="admin-video-thumb-row">
                          <div className="admin-video-thumb-preview">
                            {currentThumb ? (
                              <img
                                src={assetUrl(currentThumb)}
                                alt="Thumbnail preview"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onLoad={(e) => {
                                  e.currentTarget.style.display = 'block';
                                }}
                              />
                            ) : (
                              <span className="no-thumb-label">No Thumbnail</span>
                            )}
                          </div>
                          <div className="admin-video-thumb-controls">
                            <input
                              type="text"
                              placeholder="/media/music/your-photo.jpeg or image URL"
                              value={vid.poster || vid.thumb || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateState(setVideos, (v) => {
                                  const list = [...(v.music || [])];
                                  list[idx] = { ...list[idx], poster: val, thumb: val };
                                  return { ...v, music: list };
                                });
                              }}
                            />
                            <div className="admin-thumb-btn-row">
                              {ytId && (
                                <button
                                  type="button"
                                  className="admin-btn small secondary"
                                  title="Pull the thumbnail frame directly from YouTube"
                                  onClick={() => {
                                    const ytThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                                    updateState(setVideos, (v) => {
                                      const list = [...(v.music || [])];
                                      list[idx] = { ...list[idx], poster: ytThumb, thumb: ytThumb };
                                      return { ...v, music: list };
                                    });
                                  }}
                                >
                                  ⚡ Use YouTube Frame
                                </button>
                              )}
                              <button
                                type="button"
                                className="admin-btn small secondary"
                                title="Reset to the mountain portrait photo"
                                onClick={() => {
                                  updateState(setVideos, (v) => {
                                    const list = [...(v.music || [])];
                                    list[idx] = {
                                      ...list[idx],
                                      poster: '/media/music/pipa-portrait-01.jpeg',
                                      thumb: '/media/music/pipa-portrait-01.jpeg',
                                    };
                                    return { ...v, music: list };
                                  });
                                }}
                              >
                                Use Mountain Portrait
                              </button>
                            </div>
                          </div>
                        </div>
                        <span className="admin-field-hint">
                          To use your own personalized picture, place your image into <code>public/media/music/</code> and enter the path here (e.g. <code>/media/music/pipa-performance-1.jpeg</code>), or click <strong>⚡ Use YouTube Frame</strong>.
                        </span>
                      </div>

                      <div className="admin-form-group">
                        <label>Performance Description</label>
                        <textarea
                          rows={2}
                          value={vid.description || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setVideos, (v) => {
                              const list = [...(v.music || [])];
                              list[idx] = { ...list[idx], description: val };
                              return { ...v, music: list };
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: HOBBIES & GALLERIES */}
          {activeTab === 'hobbies' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Hobbies, Photography & Videos</h2>
                <p>Manage category descriptions, photo captions, and video links for Diving, Snowboarding, and Little Companions.</p>
              </div>

              {/* Category Intros */}
              <div className="admin-card">
                <h3>Category Descriptions</h3>
                {hobbies.categories.map((cat, idx) => (
                  <div className="admin-subcard" key={cat.id}>
                    <h4>{cat.title} ({cat.subtitle})</h4>
                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={cat.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setHobbies, (h) => {
                              const list = [...h.categories];
                              list[idx] = { ...list[idx], title: val };
                              return { ...h, categories: list };
                            });
                          }}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Subtitle</label>
                        <input
                          type="text"
                          value={cat.subtitle}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setHobbies, (h) => {
                              const list = [...h.categories];
                              list[idx] = { ...list[idx], subtitle: val };
                              return { ...h, categories: list };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label>Introduction</label>
                      <textarea
                        rows={3}
                        value={cat.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState(setHobbies, (h) => {
                            const list = [...h.categories];
                            list[idx] = { ...list[idx], description: val };
                            return { ...h, categories: list };
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Gallery Photo Manager */}
              <div className="admin-card">
                <div className="subcard-header">
                  <h3>Photo Captions & Reordering</h3>
                  <div className="admin-pill-group">
                    {['diving', 'snowboarding', 'companions', 'music', 'science'].map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        className={`pill-btn ${activeGalleryCategory === cat ? 'is-active' : ''}`}
                        onClick={() => setActiveGalleryCategory(cat)}
                      >
                        {cat} ({(media[cat] || []).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-gallery-editor-list">
                  {(media[activeGalleryCategory] || []).map((photo, pIdx) => (
                    <div className="admin-photo-card" key={photo.src || pIdx}>
                      <div className="photo-thumb-col">
                        <img src={assetUrl(photo.thumb || photo.src)} alt={photo.alt} loading="lazy" />
                        <span className="photo-index">#{pIdx + 1}</span>
                      </div>
                      <div className="photo-fields-col">
                        <div className="admin-form-row">
                          <div className="admin-form-group">
                            <label>Title</label>
                            <input
                              type="text"
                              value={photo.title || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateState(setMedia, (m) => {
                                  const list = [...(m[activeGalleryCategory] || [])];
                                  list[pIdx] = { ...list[pIdx], title: val };
                                  return { ...m, [activeGalleryCategory]: list };
                                });
                              }}
                            />
                          </div>
                          <div className="admin-form-group">
                            <label>Alt Text (Accessibility)</label>
                            <input
                              type="text"
                              value={photo.alt || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateState(setMedia, (m) => {
                                  const list = [...(m[activeGalleryCategory] || [])];
                                  list[pIdx] = { ...list[pIdx], alt: val };
                                  return { ...m, [activeGalleryCategory]: list };
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="admin-form-group">
                          <label>Caption</label>
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setMedia, (m) => {
                                const list = [...(m[activeGalleryCategory] || [])];
                                list[pIdx] = { ...list[pIdx], caption: val };
                                return { ...m, [activeGalleryCategory]: list };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="photo-actions-col">
                        {pIdx > 0 && (
                          <button
                            type="button"
                            className="admin-btn-icon"
                            title="Move Up"
                            onClick={() => {
                              updateState(setMedia, (m) => {
                                const list = [...(m[activeGalleryCategory] || [])];
                                const temp = list[pIdx - 1];
                                list[pIdx - 1] = list[pIdx];
                                list[pIdx] = temp;
                                return { ...m, [activeGalleryCategory]: list };
                              });
                            }}
                          >
                            ↑
                          </button>
                        )}
                        {pIdx < (media[activeGalleryCategory] || []).length - 1 && (
                          <button
                            type="button"
                            className="admin-btn-icon"
                            title="Move Down"
                            onClick={() => {
                              updateState(setMedia, (m) => {
                                const list = [...(m[activeGalleryCategory] || [])];
                                const temp = list[pIdx + 1];
                                list[pIdx + 1] = list[pIdx];
                                list[pIdx] = temp;
                                return { ...m, [activeGalleryCategory]: list };
                              });
                            }}
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diving & Exploration Videos */}
              <div className="admin-card">
                <div className="subcard-header">
                  <h3>Diving & Ocean Videos ({(videos.diving || []).length})</h3>
                  <button
                    type="button"
                    className="admin-btn primary small"
                    onClick={() => {
                      const newVideo = {
                        id: `diving-video-${Date.now()}`,
                        title: 'New Underwater Video',
                        description: 'Underwater exploration footage',
                        category: 'diving',
                        location: 'Ko Tao, Thailand',
                        date: String(new Date().getFullYear()),
                        externalUrl: '',
                        poster: '/media/diving/thumbs-video/hobbies-video-01-poster.jpg',
                        thumb: '/media/diving/thumbs-video/hobbies-video-01-thumb.jpg',
                        status: 'pending',
                      };
                      updateState(setVideos, (v) => ({
                        ...v,
                        diving: [...(v.diving || []), newVideo],
                      }));
                    }}
                  >
                    + Add Diving Video
                  </button>
                </div>

                {(videos.diving || []).map((vid, idx) => {
                  const currentUrl = vid.externalUrl || vid.hostedUrl || '';
                  const ytId = vid.youtubeId || extractYoutubeId(currentUrl);
                  const currentThumb = vid.poster || vid.thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');

                  return (
                    <div className="admin-subcard" key={vid.id || idx}>
                      <div className="subcard-header">
                        <strong>Video {idx + 1}: {vid.title || 'Untitled Video'}</strong>
                        <button
                          type="button"
                          className="admin-btn-icon delete"
                          onClick={() => {
                            updateState(setVideos, (v) => ({
                              ...v,
                              diving: v.diving.filter((_, i) => i !== idx),
                            }));
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="admin-form-row">
                        <div className="admin-form-group" style={{ flex: 2 }}>
                          <label>Video Title</label>
                          <input
                            type="text"
                            value={vid.title || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setVideos, (v) => {
                                const list = [...(v.diving || [])];
                                list[idx] = { ...list[idx], title: val };
                                return { ...v, diving: list };
                              });
                            }}
                          />
                        </div>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                          <label>Date</label>
                          <input
                            type="text"
                            placeholder="e.g. 2024"
                            value={vid.date || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setVideos, (v) => {
                                const list = [...(v.diving || [])];
                                list[idx] = { ...list[idx], date: val };
                                return { ...v, diving: list };
                              });
                            }}
                          />
                        </div>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                          <label>Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Ko Tao, Thailand"
                            value={vid.location || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateState(setVideos, (v) => {
                                const list = [...(v.diving || [])];
                                list[idx] = { ...list[idx], location: val };
                                return { ...v, diving: list };
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label>Hosted Video URL (Cloudflare R2 / Direct MP4 / YouTube / Vimeo)</label>
                        <input
                          type="text"
                          placeholder="https://pub-....r2.dev/video.mp4 or https://..."
                          value={currentUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const detectedYt = extractYoutubeId(val);
                            updateState(setVideos, (v) => {
                              const list = [...(v.diving || [])];
                              list[idx] = {
                                ...list[idx],
                                externalUrl: val,
                                hostedUrl: val,
                                ...(detectedYt ? { youtubeId: detectedYt } : {}),
                              };
                              return { ...v, diving: list };
                            });
                          }}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Thumbnail / Poster Picture</label>
                        <div className="admin-video-thumb-row">
                          <div className="admin-video-thumb-preview">
                            {currentThumb ? (
                              <img
                                src={assetUrl(currentThumb)}
                                alt="Thumbnail preview"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onLoad={(e) => {
                                  e.currentTarget.style.display = 'block';
                                }}
                              />
                            ) : (
                              <span className="no-thumb-label">No Thumbnail</span>
                            )}
                          </div>
                          <div className="admin-video-thumb-controls">
                            <input
                              type="text"
                              placeholder="/media/diving/... or image URL"
                              value={vid.poster || vid.thumb || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateState(setVideos, (v) => {
                                  const list = [...(v.diving || [])];
                                  list[idx] = { ...list[idx], poster: val, thumb: val };
                                  return { ...v, diving: list };
                                });
                              }}
                            />
                            {ytId && (
                              <div className="admin-thumb-btn-row">
                                <button
                                  type="button"
                                  className="admin-btn small secondary"
                                  onClick={() => {
                                    const ytThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                                    updateState(setVideos, (v) => {
                                      const list = [...(v.diving || [])];
                                      list[idx] = { ...list[idx], poster: ytThumb, thumb: ytThumb };
                                      return { ...v, diving: list };
                                    });
                                  }}
                                >
                                  ⚡ Use YouTube Frame
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label>Video Description</label>
                        <textarea
                          rows={2}
                          value={vid.description || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(setVideos, (v) => {
                              const list = [...(v.diving || [])];
                              list[idx] = { ...list[idx], description: val };
                              return { ...v, diving: list };
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>Media Library & Finder Workflow</h2>
                <p>Browse optimized photographs across your website and review your local Finder media pipeline.</p>
              </div>

              <div className="admin-card">
                <h3>How to Add New Photos via Finder</h3>
                <div className="admin-workflow-guide">
                  <div className="guide-step">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Add images to Finder folders</strong>
                      <p>Drop your full-resolution photos into <code>media-inbox/diving/</code>, <code>snowboarding/</code>, <code>companions/</code>, or <code>music/</code>.</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Run automated media optimizer</strong>
                      <p>Run <code>npm run media:import</code> in your terminal. It generates optimized multi-resolution images (480w, 960w, 1600w) and keeps existing captions intact.</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-num">3</span>
                    <div>
                      <strong>Edit captions here in the Visual Editor</strong>
                      <p>The new photos will appear immediately in the <strong>Hobbies & Galleries</strong> tab where you can customize their captions, titles, and order.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h3>All Website Media Files</h3>
                <div className="admin-media-browser-grid">
                  {Object.entries(media).map(([category, photos]) =>
                    (photos || []).map((photo, i) => (
                      <div className="media-browser-item" key={photo.src || `${category}-${i}`}>
                        <img src={assetUrl(photo.thumb || photo.src)} alt="" loading="lazy" />
                        <span className="media-cat-badge">{category}</span>
                        <span className="media-file-path" title={photo.src}>{photo.src.split('/').pop()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GITHUB PUBLISHING & AUTH */}
          {activeTab === 'auth' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2>GitHub Publishing & Security</h2>
                <p>Configure authentication for publishing updates directly to your GitHub Pages repository.</p>
              </div>

              <div className="admin-card">
                <h3>Authentication Status</h3>
                {isLocalDev ? (
                  <div className="admin-notice-box success">
                    <strong>✓ Running in Local Development Mode</strong>
                    <p>
                      You are running on your computer (<code>localhost</code>). Changes are saved directly to project files on disk with one click. No GitHub token is required for local editing.
                    </p>
                  </div>
                ) : authData ? (
                  <div className="admin-auth-profile">
                    <img src={authData.avatarUrl} alt="" className="admin-avatar-large" />
                    <div>
                      <strong>Connected to GitHub as {authData.name} (@{authData.username})</strong>
                      <p>Repository: <code>lian0-0mochi/LWang.github.io</code> (Default branch: <code>{authData.defaultBranch}</code>)</p>
                      <button type="button" className="admin-btn secondary small" onClick={handleSignOut}>
                        Sign Out / Disconnect Token
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="admin-notice-box warning">
                      <strong>Sign In Required for Publishing Online</strong>
                      <p>
                        To save drafts or publish changes directly to GitHub from your browser, please enter a fine-grained GitHub Personal Access Token.
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="admin-auth-form">
                      <div className="admin-form-group">
                        <label>GitHub Personal Access Token</label>
                        <input
                          type="password"
                          placeholder="github_pat_..."
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="admin-btn primary"
                        disabled={authLoading || !tokenInput.trim()}
                      >
                        {authLoading ? 'Verifying Token...' : 'Connect GitHub Account'}
                      </button>
                      {authError && <p className="admin-error-text">{authError}</p>}
                    </form>
                  </div>
                )}
              </div>

              {/* Passcode Protection Card */}
              <div className="admin-card">
                <h3>Editor Passcode Protection</h3>
                <p className="admin-card-sub" style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
                  The Visual Content Editor is protected with a private passcode. Visitors who navigate to <code>#admin</code> or press <kbd>Cmd+Shift+E</kbd> must enter this passcode to access content management.
                </p>

                <div className="admin-passcode-box" style={{ maxWidth: '24rem' }}>
                  <div className="admin-form-group">
                    <label>New Passcode</label>
                    <input
                      type="password"
                      placeholder="Enter new passcode..."
                      value={newPasscode}
                      onChange={(e) => {
                        setNewPasscode(e.target.value);
                        setPasscodeMsg(null);
                      }}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Confirm New Passcode</label>
                    <input
                      type="password"
                      placeholder="Confirm new passcode..."
                      value={confirmPasscode}
                      onChange={(e) => {
                        setConfirmPasscode(e.target.value);
                        setPasscodeMsg(null);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="admin-btn primary small"
                    disabled={!newPasscode || newPasscode !== confirmPasscode}
                    onClick={async () => {
                      if (newPasscode.length < 4) {
                        setPasscodeMsg({ type: 'error', text: 'Passcode must be at least 4 characters.' });
                        return;
                      }
                      const hashed = await hashPasscode(newPasscode);
                      updateState(setSite, (s) => ({ ...s, adminPasswordHash: hashed }));
                      setNewPasscode('');
                      setConfirmPasscode('');
                      setPasscodeMsg({ type: 'success', text: '✓ Passcode updated successfully! Remember to save or publish changes.' });
                    }}
                  >
                    Update Passcode
                  </button>
                  {passcodeMsg && (
                    <p className={`admin-msg-text ${passcodeMsg.type}`} style={{ marginTop: '0.65rem', fontSize: '0.85rem' }}>{passcodeMsg.text}</p>
                  )}
                </div>
              </div>

              {/* Step by Step Token Guide */}
              <div className="admin-card">
                <h3>How to Create a Fine-Grained GitHub Token (One-time setup)</h3>
                <ol className="admin-token-steps">
                  <li>Log in to GitHub and go to <strong>Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens</strong>.</li>
                  <li>Click <strong>Generate new token</strong>.</li>
                  <li>Name it: <code>LWang Website Visual Editor</code>.</li>
                  <li>Under <strong>Repository access</strong>, select <strong>Only select repositories</strong> → choose <code>LWang.github.io</code>.</li>
                  <li>
                    Under <strong>Permissions → Repository permissions</strong>:
                    <ul>
                      <li><strong>Contents</strong>: Select <code>Read and write</code></li>
                      <li><strong>Pull requests</strong>: Select <code>Read and write</code></li>
                    </ul>
                  </li>
                  <li>Click <strong>Generate token</strong> and paste the generated string into the input above.</li>
                </ol>
                <p className="admin-hint">
                  🔒 <strong>Security Guarantee:</strong> Your token is stored only in your private browser session. It is never committed, never written to any file, and never sent to any third-party server.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal for Direct Publish */}
      {showPublishConfirm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Publish Directly to Live Website?</h3>
            <p>
              This will commit your changes directly to the <code>main</code> branch of your GitHub repository.
            </p>
            <p>
              GitHub Actions will immediately build and deploy the update to your live website at <strong>https://lian0-0mochi.github.io/LWang.github.io/</strong>.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn outline"
                onClick={() => setShowPublishConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn highlight"
                onClick={publishDirectlyToMain}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Yes, Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
