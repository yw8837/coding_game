# Desktop thumbnails and game hostname — 2026-10-10

Scope: CODE:SHIFT 0.13.2 RC promotional posters and web hostname only.

## Delivered changes

- Person-free Korean desktop/code/app composition: `버그 고치고 / 내 앱 출시`.
- English poster: `FIX BUGS. / SHIP YOUR APP.`. The English about page selects it; Korean and Japanese pages retain the Korean poster.
- Both posters are 1280×720 promotional artwork derived from actual game UI, not unedited screenshots or Steam capsule art. Full-size originals, prompts and 320px reviews are retained in `output/thumbnail-desktop-v3/` and the separate delivery folder.
- Canonical URLs, hreflang, sitemap and robots now use `https://code.yeolmaeapps.kr`. About pages include localized Open Graph and large Twitter card images.
- Existing 30-second videos, BGM, gameplay and Windows package remain the same.

## Domain

User selected `code.yeolmaeapps.kr`. Sites project `appgprj_6ac692bdae7c81919f5263a7fe42990f` remains public.

Cloudflare DNS added only the `code` CNAME (DNS-only, target `custom-domains.chatgpt.site`) and the two hostname verification TXT records. Existing apex, `starlog`, `timer` and `jobs` Worker records were preserved. Sites reported hostname/provider/SSL all `active`, with no error. HTTPS requests returned 200 for the game hostname and the Starlog apex.

The original `codeshift-lab.bsfire1237.chatgpt.site` stays available. Browser saves are origin-specific: previous progress does not automatically appear on the new hostname. On the old address use Settings → Export backup, then Settings → Import backup on the new address. Import asks for confirmation before replacing current progress.

## Verification

- Focused ESLint (AboutPage, metadata and root layout): pass, zero warnings.
- Full TypeScript check: pass.
- Production build: pass. Existing Vinext static route classification note remains; no new build failure.
- Production browser smoke: pass, 10.52 seconds, zero page errors.
- KO/EN/JA: correct poster selection and 1280×720 decode; correct canonical/OG image/Twitter card; 1920×1080 video playback and seek to 16 seconds; 30-second duration; BGM attribution link.
- KO/EN/JA: empty desktop start and localized terminal `help` checked.

This is a focused regression check for the media/domain change, not a new full gameplay, human playtest or Steam approval claim. Publication receipts and the live page screenshot are retained in the delivery folder after deployment.
