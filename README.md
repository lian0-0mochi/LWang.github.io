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

## Videos and Local Originals

Original media is preserved in `media-originals/archive/`. This folder is
ignored by Git and excluded from `dist/`. Keep it on your computer or in your
own backup when changing computers. It is not restored by cloning GitHub.

The four oversized files are:

| Local archive path | Size |
| --- | --- |
| `media-originals/archive/GX010079.MP4` | 435,466,900 bytes |
| `media-originals/archive/My_Edit.mp4` | 155,546,143 bytes |
| `media-originals/archive/hobbies-videos/hobbies-video-01.mp4` | 155,546,143 bytes |
| `media-originals/archive/hobbies-videos/hobbies-video-02.mp4` | 435,466,900 bytes |

Both hobby recordings play from the local archive during `npm run dev`.
Published builds retain the titles, captions, and preview cards, with
"Recording available soon" until a hosted URL is configured. No original video
is uploaded or included in the production build.

Recommended for later: upload the two unique recordings to YouTube, optionally
as unlisted videos. Put each video ID into `exploration.videos[].youtubeId` in
`src/data.js`, just as on the Pipa page. An ID is the part after `v=` in a
YouTube watch URL. The website then embeds that recording.

Alternatively, put a direct HTTPS MP4 URL into `externalUrl`. Leave `youtubeId`
empty for direct MP4 playback. `originalSrc` records the old website reference
and `localSrc` identifies the preserved local copy; keep those fields for the
archive. The originals can also be compressed later into smaller web videos,
without replacing or deleting the originals.

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
