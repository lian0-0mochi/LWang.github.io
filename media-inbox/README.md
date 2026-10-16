# Media Inbox: Adding Photos & Videos through Finder

Drop new photos or videos into the category folders beside this file:
- `media-inbox/diving/`
- `media-inbox/snowboarding/`
- `media-inbox/companions/`
- `media-inbox/music/`
- `media-inbox/science/`

Originals placed in these folders are strictly local and ignored by Git.

---

## 1. Adding Photographs

1. Copy photos into a category inbox (e.g. `media-inbox/diving/`).
   Supported formats: JPEG, PNG, HEIC/HEIF, TIFF, WebP.
2. Run `npm run media:import` (or `npm run media:import -- diving`).
3. The script optimizes full-resolution originals into lightweight responsive web images (1600px, 960px, 480px) in `public/media/<category>/` and registers them in `src/media.generated.json`.
4. Edit titles, captions, and alt text directly in `src/media.generated.json`.

---

## 2. Adding Videos (GoPro, Phone, Diving/Snowboarding Footage, Pipa)

Videos can be hundreds of megabytes or multiple gigabytes. The website uses an external hosting architecture (unlisted YouTube or Vimeo) paired with automatic local thumbnail extraction and click-to-load playback.

### Step-by-Step Video Workflow:
1. **Export & Drop**: Export your video from your camera/GoPro/phone and drop it into `media-inbox/<category>/` (e.g. `media-inbox/diving/my-dive.mp4`). Supported formats: `.mp4`, `.mov`, `.m4v`, `.webm`, `.avi`, `.mkv`.
2. **Run Import**: Run:
   ```sh
   npm run media:import
   # or import only videos:
   npm run media:import:videos
   ```
   **What happens automatically**:
   - High-quality poster (1600px) and thumbnail (480px) images are extracted from the video into `public/media/<category>/thumbs-video/`.
   - Video duration and metadata are recorded.
   - A new entry is added to `src/videos.json` in a pending state.
   - Your original video file is safely moved to `media-originals/videos/<category>/` where it remains preserved in 100% full quality. It is NEVER tracked in Git and NEVER bundled into the deployed site.
3. **Upload to YouTube (Unlisted)**: Upload your original video to YouTube (select **Unlisted** so it stays private to visitors of your website) or Vimeo.
4. **Add URL**: Open `src/videos.json` and paste your YouTube link into `externalUrl`:
   ```json
   {
     "id": "my-dive",
     "title": "Ko Lipe Coral Reef & Sea Turtle",
     "description": "Underwater encounter during morning dive.",
     "location": "Ko Lipe, Thailand",
     "date": "2024",
     "externalUrl": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
   }
   ```
5. **Preview Locally**: Run `npm run dev` to preview the video card and click-to-load modal.
6. **Publish**: Commit only `src/videos.json` and the generated thumbnails (`public/media/.../thumbs-video/`). GitHub Pages deploys instantly with zero heavy video bloat.
