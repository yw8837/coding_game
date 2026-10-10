# Reference coverage and release decisions — 2026-10-10

The main visual-flow analysis is documented. **Continuous viewing and listening
of every supplied video is not complete.** Do not call sampled screenshots,
storyboards or transcripts a complete video watch. The following records were
checked against retained local evidence during the release quality pass.

| Source | Evidence actually reviewed | Limits |
| --- | --- | --- |
| Original HackHub video, HWQz19cO2JQ, approximately 1h47m | 163 real frames; first 5 minutes at 5-second intervals, later at 60-second intervals; final frame 1:46:58; 41 contact sheets | Brief interactions between samples and audio were not continuously reviewed. The closing review segment is not the game's ending. |
| English video, vMDS10pL0N0, 3:21:22 | 163 real frames including three denser interaction sequences; nine full-size reinspections; all 1,963 English transcript segments | Full transcript review is not continuous audiovisual viewing. |
| Korean live video, gMjduQanVn4, 1:06:57 | 46 real frames at 90-second intervals | Starts mid-session, so it cannot establish first-time onboarding. Captions unavailable. |
| Playlist PLZ65Bh0LwRtBoGqh8oB1-i7WjhoNvESc6, 19 videos | 252 principal real frames plus ending samples; all 19 now also have source-specific automated reports, cross-checked as described in the follow-up | Reports contain errors. Playlist duration is not game playtime. Not every transition or sound was reviewed. |
| Learning blog and coding-learning projects | Retained original Korean transcript/blog extracts; project-specific source and licensing notes in the linked reports | A reference set, not evidence of curriculum efficacy or intermediate/advanced proficiency. |
| Engine, game and video repositories supplied by the user | Triage and selected documentation/source review in reference-research.md | Not every repository was installed, run or audited. No engine replacement is claimed. |
| AI Tech Studio MCP | Successful initialize, tool listing, search and technique retrieval receipts; pinned upstream MIT license | Public research, not a runtime service. Proposal notes must be distinguished from shipped integrations. |

The four video groups account for 624 principal frame samples, with additional
close inspections/end samples recorded separately. Source media, manifests and
contact sheets remain under the local temporary reference directory named in
the detailed reports. They are not shipped with the game.

## What is applied to this game

| Observed principle | Current implementation / acceptance evidence |
| --- | --- |
| A player can recover the current objective even with overlapping windows | The desktop quest panel shows the current task, app/file and next action. Opening, minimizing, closing and reopening an app must never complete the task. `quest-context.py` checks three locales and three viewport sizes. |
| A change should have a visible, understandable result | Cafe repair previews, saved-change feedback, client test results and career impact panels connect the edit to its result. `coach.py`, `freedom.py` and native campaign QA verify actual changes and delivery. |
| Guidance needs to preserve player agency | Hints remain closed until requested. Failed/empty edits do not solve the job. Direct mode supports typed commands and supported alternate JavaScript solutions; tests do not equate any arbitrary source text with a valid result. |
| The terminal needs useful context and predictable behavior | Browser history, command queue, `clear`, Ctrl+L, command history and editable buffers are covered by state-sync/terminal UI regressions. Commands operate inside the game's virtual computer. |
| Progress and rewards must follow real work | Saved revision/check/delivery state controls completion. Rechecking or opening windows does not pay twice. Credits buy workspace tools; game-ending release follows a chosen contract route. |
| Keep a distinct identity | Neighborhood clients, a repair-and-release goal, original characters and the Windows-like desktop remain. HackHub artwork, dialogue and mission story are not copied into this game. |

AI Tech Studio i499/i147/i165/i202 audio and numerical feedback are already
integrated. The later i45/i400 research informed state-based quest guidance.
i226 pulsing outlines and i208 reward-token flight are **optional proposals**,
not requirements or claims of completed additions. Avoid extra animation when
the existing task indicator and exact wallet delta already explain the action.

## Remaining evidence

### Automated full-video analysis attempt in this pass

The initial vidIQ `video_watch` pass submitted six requests advertised as 25 credits
each. The earlier claim that these consumed 150 credits was an incorrect inference:
the later balance was 144, and 17 additional accepted requests changed it to 127.
Submission receipts still report 25 each; do not treat the advertised sum as actual
billed usage. No credits were purchased. A completed job is **not** proof that the
service accessed or watched the source. The initial reports were retained for
audit and checked against the existing frames:

| Video / job | Result and evidence decision |
| --- | --- |
| HWQz19cO2JQ / `job_9ed7249c-1f05-480d-9160-d96ce7180871` | A source-length timeline was returned. Advisory only: not independently verified throughout, so no continuous-viewing credit. |
| vMDS10pL0N0 / `job_ad6203fc-fda0-4119-8e5d-e86d5bb4f540` | **Rejected.** Described an unrelated roughly ten-minute coding game instead of the 3:21:22 HackHub source. |
| gMjduQanVn4 / `job_2ee39998-0acf-4009-8107-d0d87aa2e736` | **Unreliable.** Reversed timestamps and an unsupported closing/completion claim. Direct 66:54 frame shows multiple terminals and an unfinished Part 6 objective. |
| vMDS10pL0N0 retry / `job_c8b08fc8-0917-47cb-8980-b3201807d0c9` | **Access failed.** The service explicitly stated that no stream, frames or timeline were accessible. |
| II8UiTmjCoc / `job_85f8f23b-a077-4173-8ba2-95094b670ace` | Setup report is consistent with inspected 00:00–00:50 and 03:00 frames: desktop, visible setup checklist, registration and first-job application. Other exact timings/audio remain unverified. |
| XrQjCfUwXSw / `job_7b194c26-0aa4-4ad2-ba94-a75a6fe9d32b` | Final sequence is consistent with inspected 09:00–11:53 frames: windows coexist, checklist persists and final delivery leaves a waiting objective. Other exact timings/audio remain unverified. |

The other 17 playlist videos initially had sampled-frame evidence only. After the
connection notification, the observed remaining balance allowed additional analysis
of all 17. All results were retrieved and cross-checked; additional ending frames
resolve several earlier delivery/next-chapter ambiguities. This does not make them
17 verified continuous viewings. A false hotspot-completion claim and other errors
were rejected. The failed long-source requests were not repeated. See the
[follow-up and validation table](vidiq-followup-2026-10-10.md) and its receipts.

The directly observed design lesson is continuity: keep the current goal visible
while moving between apps, show which work produced the outcome, and retain the
result after a transient reward. This pass applies it to actionable diagnostic
results, a persistent client portfolio, and a separate post-release workbench.
Attack workflows and reference artwork/dialogue are not imported.

Selected screenshot samples cannot settle moment-to-moment pacing, sound mix,
human comprehension or enjoyment. Release validation still needs independent
beginner and experienced-player observations, target-speaker/headphone listening,
native-language review and another Windows PC. A request for full continuous
viewing remains unfulfilled by these records; this report does not silently
redefine it as completed.

Detailed sources: [additional playlist analysis](vidiq-followup-2026-10-10.md),
[original visuals](original-visual-2026-10-10.md),
[English visuals and transcript](english-full-transcript-2026-10-10.md),
[Korean video and playlist](korean-playlist-2026-10-10.md),
[MCP research](techstudio-quest-techniques-2026-10-10.md),
[shipped MCP feedback](../QA-TECHSTUDIO-FEEDBACK.md),
[coding-learning projects](../coding-learning-references.md),
[repository triage](../reference-research.md).
