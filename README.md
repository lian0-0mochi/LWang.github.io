# Lianzijun Wang's Website

This React + Vite portfolio contains the current homepage, research papers,
pipa page, Hobbies galleries, and CV preview. It uses plain CSS and hash
navigation and needs no backend or paid service.

## Open in Antigravity

Open this folder as the project, not a folder inside it:

```text
/Users/lianzijunwang/Documents/GitHub/LWang.github.io
```

Use Node.js 22. In the project's terminal:

```sh
npm ci
npm run dev
```

Open the URL Vite prints, including `/LWang.github.io/` at the end. To stop
your development server, press Ctrl+C in its terminal. If the default port is
busy, Vite selects a different port.

## Change Text or the CV

- Edit `src/data.js` for biography, education, publications, contact information,
  page labels, and video settings.
- Edit `src/media.generated.json` for gallery titles, captions, alt text,
  location, and date. Keep the image paths intact unless moving images.
- Replace `public/files/Lian_Wang_CV_2026.pdf` to update the CV. If you rename it,
  update `profile.cvPath` in `src/data.js` too.
- Paper PDFs are in `public/publications/`; paper figure snapshots are also
  available in `public/media/science/`. Edit each paper's `figure.src`,
  `journalUrl`, and `pdfUrl` in `src/data.js` when replacing them.

Content paths start with `/media/`, `/files/`, or `/publications/`. The app adds
the deployment base automatically. Do not prepend `/LWang.github.io/` in the
content data. Sample SVG illustrations retain their placeholder names.

## Add Photos in Finder

The organized website folders are:

```text
public/media/diving/
public/media/snowboarding/
public/media/companions/
public/media/music/
public/media/science/
```

For new images, use the matching folders in **`media-inbox/`** instead of placing
full-resolution originals directly in `public/`:

1. Copy photos in Finder into, for example, `media-inbox/diving/`.
2. Run `npm run media:import -- diving`, or `npm run media:import` for all folders.
3. Edit the new entries in `src/media.generated.json` with useful captions and
   alt text. The gallery updates automatically during development.
4. Review the generated images and manifest in GitHub Desktop.

The macOS importer uses the built-in `sips` utility to create JPEGs with a
maximum long edge of 1600 pixels and 480/960-pixel thumbnails. It preserves
aspect ratio, skips videos, avoids duplicate entries, and keeps edited captions
on reruns. Supported input: JPEG, PNG, HEIC/HEIF, TIFF, and WebP. Imported images
work on any platform; importing new images currently requires macOS.

On a fresh clone, run `npm run media:import` once to create the empty inbox
folders. Inbox originals are ignored by Git. Existing imported photographs and
thumbnails are already part of the website files.

## Videos and Scalable Video Management

The website includes a dedicated video management system designed to handle large recordings (such as 4K underwater GoPro videos, snowboarding runs, and pipa performances) without bloating the repository or slowing down page loads.

### Architecture Overview

1. **Local Preservation**: Original video files stay strictly on your local machine in full quality within `media-originals/` (which is in `.gitignore`). They are never compressed, overwritten, or committed to GitHub.
2. **External Hosting**: Public video streaming is powered by externally hosted video URLs (unlisted YouTube videos by default, or Vimeo).
3. **Click-to-Load Playback**: Galleries and music pages load only lightweight poster thumbnails (~20–70 KB) instead of gigabyte video files or heavy iframes upfront. When a visitor clicks a video card, a responsive lightbox modal loads the player on demand. Closing the modal immediately unmounts the player, completely stopping playback and releasing browser memory.
4. **Automated Thumbnailing**: Placing a video into `media-inbox/<category>/` and running `npm run media:import` automatically extracts high-definition poster and thumbnail images (using FFmpeg if available, or macOS native AVFoundation tools) and records the duration and metadata into `src/videos.json`.
5. **Pending Preview State**: If a video does not yet have an external hosted URL, it appears as an attractive preview card with a "Hosted video coming soon" badge, preventing broken links or 404 errors.
6. **Deployment Guardrails**: Pre-deployment validation scripts (`npm run check:files` and `npm run check:assets`) verify that no raw video files or assets over 100 MiB are ever tracked in Git or bundled into `public/` or `dist/`.

### 7-Step Workflow to Add New Videos

Whenever you have new footage to add:

1. **Export the Video**: Save or export the video file from your phone, GoPro, or camera (e.g. `GX010079.MP4` or `snowboard-run.mov`).
2. **Drop into Media Inbox**: In Finder, drop the file into the appropriate inbox folder:
   - `media-inbox/diving/`
   - `media-inbox/snowboarding/`
   - `media-inbox/music/`
   - `media-inbox/companions/`
3. **Run the Import Command**: In the terminal, run:
   ```sh
   npm run media:import
   # or run video import specifically:
   npm run media:import:videos
   ```
   This extracts the poster and thumbnail into `public/media/<category>/thumbs-video/`, registers the video in `src/videos.json`, and safely moves the original file into `media-originals/videos/<category>/`.
4. **Upload to YouTube (Unlisted)**: Upload your original video to YouTube and set visibility to **Unlisted** (or upload to Vimeo). This keeps the video private to visitors of your website.
5. **Add the Hosted Link**: Open `src/videos.json` and paste your YouTube URL into `externalUrl` (or set `youtubeId`):
   ```json
   {
     "id": "manta-ray-dive",
     "title": "Manta Ray Encounter in Ko Lipe",
     "category": "diving",
     "description": "Close encounter with a manta ray during an open water dive.",
     "location": "Ko Lipe, Thailand",
     "date": "2024",
     "externalUrl": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
   }
   ```
6. **Preview Locally**: Run `npm run dev` and open the gallery to verify the thumbnail, duration badge, and click-to-load modal playback.
7. **Commit and Publish**: In GitHub Desktop, stage and commit only `src/videos.json` and the generated thumbnails (`public/media/.../thumbs-video/`). Your original video files remain safely in `media-originals/` and will never break deployment limits.

## Check and Build

```sh
npm test
npm run check:assets
npm run check:files
npm run build
npm run preview
```

`check:files` checks tracked and unignored files against GitHub's 100 MiB limit.
`check:assets` checks media paths and PDF downloads. `npm run preview` serves
the production build, including its pending video cards, rather than local
archive playback.

## GitHub Desktop

1. Select `LWang.github.io` and review the **Changes** tab.
2. Keep originals, inbox photos, `node_modules`, and `dist` out of the commit;
   they are already ignored. Run `npm run check:files` before committing.
3. When satisfied, enter a summary such as "Migrate complete personal website"
   and click **Commit to main**. This saves a local commit only.
4. Click **Push origin** only when ready to upload and publish.

The Pages workflow in `.github/workflows/deploy.yml` runs on pushes to `main`
or manual dispatch. It installs dependencies, checks files and assets, builds,
and deploys `dist/`. A push to `main` starts this deployment when Pages is set
to GitHub Actions. Do not push until the site has been reviewed.

This is a **project site**: its future URL is
`https://lian0-0mochi.github.io/LWang.github.io/`. Accordingly,
`vite.config.js` uses `base: '/LWang.github.io/'`. The username-root repository
`lian0-0mochi.github.io` is a separate repository.

When ready, set the repository's **Settings > Pages > Source** to **GitHub
Actions**. No repository setting is changed by the local migration.

References: [Vite's Pages deployment guide](https://vite.dev/guide/static-deploy.html#github-pages)
and [GitHub's large-file limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
