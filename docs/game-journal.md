# Development journal

Add one Markdown file per update in a game's directory:

```text
contents/game-journal/
  tessora/
    2026-11-07-new-gameplay.md
  ruptura/
  deploy-ou-ruina/
```

Example front matter (replace all sample details with verified release information):

```yaml
---
game: tessora
title: "Improving the cutting controls"
date: 2026-11-07
version: "0.2.0"
summary: "Changes to cutting interactions and how they are confirmed."
draft: true
---

Describe what changed, what you tested and what still needs work.
```

Set `draft: false` when an entry is ready to publish. The project page automatically shows the three most recent published entries and the total count; the journal archive shows every published entry in descending date order. The game slug must be `tessora`, `ruptura`, or `deploy-ou-ruina`.

No historical releases are generated automatically. Add only updates with verified dates and content.
