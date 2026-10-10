# Mobile history picker correction

Continues PR109 from c00c914c; the containing commit is the candidate. No backend, auth, records, financial calculations, artwork, routes or authority changes.

Mobile <=700px uses a native modal dialog with an explicit keyboard focus loop, Escape/Close, focus restoration to its trigger, bounded visual-viewport height/width and internally scrolling saved exchanges. Desktop retains its select. Shortened display labels never update stored titles or content. Full original titles remain readable through disclosure; command-like labels use Saved technical request, with date and exchange number preserving distinction. Selecting loads earlier rendered messages as necessary and restores the exact exchange by ID; selecting the same ID also scrolls back. No chat request is made.

Owner screenshot134954 establishes the old native-dropdown overflow; screenshot134815 establishes readable400x464 chat atc00c914c. Both are credited without requesting repeat proof of those defects or the baseline improvement.

Validation on the production build: five viewport combinations400x464,360x560,360x740,390x844,1440x900;25 exchanges including long technical titles; open/scroll/full title/touch and keyboard selection/close/Escape/focus wrap/restore; selected record content and scroll position; no layout consumption while the modal is open or after closing in the same selected state; no horizontal overflow. Four presentation tests, affected lint and full build/typecheck pass.

Reading evidence:400x464 initial pane228px,222px while the existing Jump toolbar is shown, six complete16px lines.360x560:318px/nine lines;360x740:329px/nine;390x844:433px/twelve. Simulated300px visual viewport:124px/three lines; resized layout plus multiline unsent draft:108px/three lines. Picker also stays inside300px visual height. Tables remain bounded and inert; initial mobile focus never opens composer; requests to /api/pillow/chat remain zero. Desktop select remains tested. This is isolated loopback proof, not physical keyboard or authenticated production acceptance.

The keyboard test initially found native modal backward Tab leaving its controls; explicit wrapping corrected that. An initial geometry assertion compared different Jump visibility states; the final test separately verifies opening/closing consumes no space and actual readable message lines. Screenshots were inspected: bounded picker and400x464 saved-content view. Hosted exact-candidate CI/preview results are recorded in the PR body after upload, without changing the tested head merely to write its own hash.

The same owner Home screenshot showed raw Markdown markers and status codes in recommendation excerpts. Presentation now strips emphasis markers and renders those two known statuses as Pillow suggestion / Evidence unverified / Awaiting your review. No recommendation is generated, deleted, reordered or approved; source detail and approved Home layout remain intact.
