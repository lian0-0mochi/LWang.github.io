# Add photographs through Finder

Copy new photographs into one of the folders beside this file: `diving`,
`snowboarding`, `companions`, `music`, or `science`. Originals in these folders
are local only and are ignored by Git.

In the project terminal, run `npm run media:import`, or import one category with
`npm run media:import -- diving`. This creates optimized JPEG images and
thumbnails in `public/media/<category>` and adds them to the website galleries.
JPEG, PNG, HEIC/HEIF, TIFF, and WebP input is supported through macOS sips.

Edit titles, captions, and alt text in `src/media.generated.json`. Rerunning the
import preserves those edits and avoids duplicate entries. Removing an inbox
original does not remove its website entry; remove entries deliberately in the
manifest when you want to remove a photograph from a gallery.

Video files are skipped. Keep originals here or in `media-originals/`; configure
video URLs in `src/data.js` as described in the main README.
