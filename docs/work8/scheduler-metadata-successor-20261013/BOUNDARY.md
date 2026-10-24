# F02 metadata integrity successor

Independent review rejected3a248c61 because missing missedSlot with retained late lastAdmission and falsy lastAdmission could incorrectly return HEALTHY. Original rejection/results are retained here.

Successor validates field presence, object shape and integer/time ordering. Legacy schedules lacking both fields remain compatible. Present malformed metadata returns UNAVAILABLE; late admission requires exactly matching missedSlot; a timely admission cannot carry a missed marker. Both-direction consistency prevents deletion of only the marker from silently clearing the detector.

Four focused contracts pass under kernel outbound denial, including22 corrupt persisted metadata cases and valid legacy/timely/late boundaries. The82.103second real scheduler receipt is reused only for unchanged scheduler production, examiner, successful late-admission marker and control paths. No new full-timer/F02 acceptance claimed; no deadline change. Prior default-heap OOM and passing4GB typecheck cover the earlier candidate. Final combined typecheck/build remains integration owner gate; no broad repeat requested for this narrow successor.
