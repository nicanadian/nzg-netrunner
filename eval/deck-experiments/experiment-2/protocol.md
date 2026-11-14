# Corp revision experiment protocol

This experiment compares the current v2 and archived v1 Corp deck documents for Precision Design, Restoring Humanity, Reality Plus and Built to Last. Each version plays all three current Gateway Runner lists. Exact documents and legality totals are frozen in design.json. Engine source stays pinned to c8c52ccc31737fc9422b50e395a7400e0be4a08b2dffddedda3e275d88c8925f.

The screen runs 40 shared seed labels per cell: 3 Runners × 8 Corp lists × 40 = 960 games. The largest absolute change in equal-weight Corp win rate across Runners selects exactly one family for an independent 200-seed confirmation: 3 Runners × 2 versions × 200 = 1,200 games. The confirmation uses a distinct seed prefix. Selection is based exclusively on the complete screen.

Uncertainty resamples complete seed clusters, each containing all three paired Runner matchups, rather than pretending those three matchups are independent. The primary confirmation requires its 97.5% cluster bootstrap interval to exclude zero and its direction to match the screen. Other screen intervals are exploratory. Missing outcomes remain visible with conservative all-scheduled effect bounds; no failures become losses.

Shared seeds do not enforce equal opening hands or random events. These are whole-list changes, including agenda distribution and deck size, under the fixed native AI. Human balance conclusions and individual-card attribution require follow-up. Mechanism inspection uses the first six held-out seeds per cell, with observers required to reproduce the entire original decision trace.
