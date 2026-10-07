# CODE:SHIFT 0.3 verification — 2026-10-07

## Scope and automated checks

The existing one-mission intro engine remains. The 18 Node tests pass: 12 existing engine tests, the guide test, persistence test and four new gameplay tests. New checks exercise old-save migration, successful versus failed exploration commands, one-time rewards across reload/clear, catalog-priced and idempotent cosmetic purchases, insufficient balance/unowned equip, and stale/changed-choice color evidence. The earlier guide integration still completes the main mission with no bonus activity.

## Browser verification

Verified in the managed preview with the earlier completed QA save (470 cr / 120 XP), which migrated with no new rewards on load.

- Message app X returns to the desktop; resume reopens the app; Escape closes it. Focus returns to the home control.
- Settings Escape and reward Escape/X close only the dialog. Both dialogs also expose large explicit buttons.
- Confirmed the pre-fix issue where Escape did not leave the cafe iframe after clicking an order button. After forwarding that key to the existing central handler, the same click/Escape returned to the desktop.
- Shift+Tab leaves the terminal input without changing input text.
- In an actual 390px embedded viewport, the page width and scroll width were both 390px. The mission panel's internal X and Escape close it. The message app's X remains visible, its text readable, and X returns to the mobile desktop.
- Ran pwd, ls, cat README.md in the local project. Explorer claim increased 470/120 to 510 cr/140 XP, marked the bonus claimed and showed its reward dialog.
- Selected ocean blue before editing: actual color check failed and the color reward remained unavailable, while the three mandatory checks passed.
- Edited the visible style.css textarea, changing the order-button background to #3678a8, and ran browser layout checks. All three mandatory conditions and both-viewport computed button colors passed. Color claim increased 510/140 to 570 cr/170 XP.
- Bought the violet theme: credits fell to 480, theme showed owned/in use, and the accent changed. Reload preserved 480 cr, 170 XP, both bonus completions and the selected theme. Main mission remained complete at 8/8.

The 390px QA fixture was removed before packaging. No player save or temporary QA route is published. `gameplay-qa.jpg` is the captured desktop workbench, including explicit close control and both claimed bonuses. The prior complete first-mission browser run is documented in `intro-demo-verification.md`; this update adds focused interaction and regression checks rather than repeating the same whole playthrough.

## Public access

Native access update returned `access_mode: public`, revision 2, for the existing project. Source build/save/deployment verification is performed by the Site workflow for this release. Public access does not synchronize local player saves.
