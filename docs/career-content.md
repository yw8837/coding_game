# Career content: 18 follow-up commissions

These authored commissions extend the existing three cafe chapters to **21 story commissions**. They are content and bounded simulation logic, not proof of a Steam release, finished packaging or a measured six-hour campaign. Actual play length requires player observation. The main task owns campaign state, progression, UI, ending selection and native integration.

The three growth acts contain six jobs each: help one small business, coordinate several records, then maintain services shared by the neighborhood. Customers are fictional. Prices, contacts, logs and requests are local examples. No arbitrary JavaScript/Python evaluation, real network request, host command or actual file deletion occurs.

| Act | ID | Customer / work | Editable files |
| --- | --- | --- | --- |
| 1 | bakery-price | Bakery: full boxes and remaining singles | pricing.json |
| 1 | library-loans | Library: exact capacity and overdue gate | policy.json |
| 1 | florist-stock | Florist: subtract reserved stock | inventory.csv |
| 1 | bike-hours | Repair shop: last drop-off and closed day | hours.json |
| 1 | contacts-clean | Club: trim/lowercase/deduplicate/skip blank | contacts.csv, clean.json |
| 1 | clinic-form | Clinic: connected label, required field, submit button | booking.html |
| 2 | market-filter | Market: available AND fresh CSV filter | products.csv, filter.json |
| 2 | school-sort | School: numeric ranking and name tie-break | scores.csv, sort.json |
| 2 | workshop-slots | Workshop: duration and non-overlapping schedule | schedule.csv |
| 2 | delivery-fees | Delivery: fee, free threshold and distance cap | delivery.json |
| 2 | museum-layout | Museum: percentage width, cap and padding model | gallery.css |
| 2 | bookstore-invoice | Bookshop: subtotal → discount → tax | items.csv, invoice.json |
| 3 | community-api | Community center: path/method pairs and persisted RSVP | routes.json |
| 3 | photo-cache | Photo club: public/private caching and user separation | cache.json |
| 3 | transit-logs | Bus service: select ERROR/503 and group by route | service.log, report.json |
| 3 | archive-backup | Archive: inclusive seven-day retention and total size | copies.csv, retention.json |
| 3 | tutor-timezone | Classroom: UTC offset and next-day carry | timezone.json |
| 3 | festival-report | Festival: paid-only rows, multiplication and grouped totals | sales.csv, summary.json |

## Player support and API

`career-content.ts` exports `Localized = {ko,en,ja}`, `CareerJob` and `CAREER_JOBS` (exactly 18). Every job has a customer, title, concrete broken result/request, short starter files, file-by-file explanations and exactly three hints. The first hint points to the observation, the second identifies the relevant setting/concept, and the third explicitly offers an answer. All these fields and the two care/craft dialogue choices have Korean, English and Japanese copy. Each customer has distinct player replies and completed-outcome responses: care focuses on the customer's changed situation, craft on the verified result. Code keys and sample data stay stable between languages.

`evaluateCareer(id, files)` returns `{passed, checks, preview}`. Each job has at least three observed checks. Check names are localized, and expected/actual values are strings suitable for text display. Preview values are the **same actual calculations**, including failed results; opening a job does not award success. These values are simulated results, not actual browser CSS measurement or requests to a real server.

`exampleSolution(id)` returns a fresh file map for tests or an explicit player request to view the answer. Evaluation never compares with or calls this helper. The UI must not auto-apply it on opening the job or after failure. Equivalent JSON formatting, reordered inventory rows, equivalent form IDs/attributes, and an integer-stock filter using >=1 instead of >0 can pass when their observable result is correct.

Requests and file descriptions identify immutable customer inputs. Filters, reports and policies must preserve the supplied rows/values; hiding counterexamples by deleting source records fails a visible check. Florist stock totals stay fixed while reservation counts are editable. Row order and equivalent numeric CSV formatting may differ when ordering is not the requested result. Checks also include the stated opening/discount/delivery boundaries, box sizes and usable form validation rather than rewarding a few matching examples alone.

A completed follow-up job pays once through main progression. Act rewards per job are 200 cr / 80 XP, 350 cr / 130 XP and 550 cr / 200 XP respectively. The 18-job sum is 6,600 cr / 2,460 XP, separate from the original cafe rewards, optional practice/bonuses and cosmetic spending. Neither selecting a dialogue choice nor opening help is evaluation evidence.

## Restricted formats and boundaries

- JSON must be an object with the documented numeric/string/boolean fields. Only supported options are interpreted. Numeric bounds and required values are checked; malformed data produces three readable failure checks.
- CSV supports at most 100 rows, fixed header names, quoted commas and doubled quotes. Multiline cells are unsupported. Numeric cells must be non-negative finite decimals. Duplicate/missing key records fail where a job requires one row per named item.
- HTML is inspected as data for the form/label/input/button semantics. It never runs. Active elements, event attributes and JavaScript URLs fail. This targeted teaching model does not certify complete web accessibility.
- CSS accepts one `.gallery` rule with width, max-width, padding and box-sizing. The limited box model reports calculated widths; arbitrary selectors, calc(), imports and browser execution are not supported.
- Logs use one line per `HH:MM LEVEL /route STATUS`. Routes/statuses, cache behavior, retention and timezone changes are pure local calculations.
- Each required source file is capped at 20,000 characters. Missing files, unknown jobs, oversized source and parser errors fail safely. Data is not executed and the evaluator does not mutate the supplied files.

## Verification

`node --test lib/game/career-evaluation.test.ts` checks all 18 faulty starters fail and all explicitly requested example solutions pass, literal outputs for each job, real edited-value changes, safe malformed source, parsing boundaries, equivalent valid solutions, localized support fields and distinct dialogue. `career.test.ts` verifies main progression through engine actions: locks, all 18 one-time rewards across reload, fresh proof and terminal-file consistency, three reply-based endings, upgrades/checkpoints and old-save defaults/invalid-save rejection. Browser QA, native packaging, release deployment, novice comprehension and play length are separate evidence.
