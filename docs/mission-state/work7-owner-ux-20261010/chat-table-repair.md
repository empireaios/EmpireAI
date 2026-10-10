# Work 7 saved-chat table readability repair

Owner-supplied recording `Inspect ZIP Screenshots - Google Chrome 2026-10-10 18-38-40.mp4` shows PR #109 preview `empireai-90ktm1oli-empireai-os.vercel.app` at parent revision `0bdbe2fc`. The final chat frames show pipe table syntax flattened into prose. Source inspection confirms that the lightweight renderer has no table block and joins unrecognised lines with spaces.

This presentation-only correction recognises a header plus matching Markdown delimiter row and renders semantic column headers and cells in a keyboard-focusable, horizontally scrollable region. Cell content remains React text/limited inline formatting; raw HTML cannot execute. Invalid row widths are retained as text. Original stored messages, copy content, history transport, composer and inference handlers are untouched.

Local parser regressions: 11/11 pass, including retained list formatting, table boundaries, escaped pipes and malformed input. Desktop/mobile isolated browser assertions now check table cells, inert HTML, focus, inherited text colour and viewport containment. Hosted results must be recorded against the new commit; old green results are not presented as testing this change.

Owner recording also verifies desktop internal message scrolling and a visible fixed composer at the parent revision. It does not show history selection, Jump to latest activation, CEO-to-chat navigation or mobile. Fixture screenshots are not live authenticated acceptance. Production merge/release and Work 7 completion remain gated.
