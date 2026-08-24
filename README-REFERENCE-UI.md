# VIBE CUT — Reference UI update

This project keeps the existing cinematic hero and updates the next sections to the supplied reference direction:

- 8 menu cards: dark navy/black background, thin gold border, editorial serif title, service image, inclusions, price and gold CTA.
- Booking modal: fixed reference proportions (up to 1180×720 desktop), 4-step progress indicator, image-led selected service, compact date/time selector, details + summary, and confirmation.
- Service switcher: reference-style list + image preview.
- Generated service imagery is in `public/services/`.

## Run

```bash
npm install
npm run dev
```

Open the localhost URL printed by Next.js.

## Notes

The images are local assets, so the UI does not depend on remote image URLs. The exact hero/cinematic code from the existing project is preserved.

The build was type-checked with `tsc --noEmit` successfully in the working environment. A production build could not complete in the sandbox because Next.js attempted to download its native SWC binary and the sandbox has no external network access.
