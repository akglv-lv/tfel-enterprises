---
name: felo-site
description: Look after the FeLo / TFeL Enterprises website in site/. Use for refreshing products or videos, checking and shipping the site, reviewing wording and colours against the brand rules, or changing which collection leads the home page. Triggers include "refresh the site", "ship it", "check the site", "is anything cringey", "feature <collection>", "update videos", "new drop".
---

# FeLo site playbook

The site is plain HTML/CSS/JS in `site/`. Everything mechanical lives in `scripts/felo.py`, so a person can run it without Claude. This skill wraps those scripts and adds the parts only a reviewer can do: looking at the pages and judging the wording.

Read `brand/BRAND.md` before judging any wording or design. Never edit `theme/`; it's the Shopify backup.

## Commands (all run from the repo root)

| Command | Does |
| --- | --- |
| `python scripts/felo.py serve` | Preview at http://localhost:5173 with caching off. Run it in the background. |
| `python scripts/felo.py refresh` | Pulls products from tfelent.com and videos from YouTube. If either fails, the last good copy stays. |
| `python scripts/felo.py check` | Every check. Errors block shipping; warnings are the "waiting on Tyler" list. |
| `python scripts/felo.py brand` | Wording and colour checks only. |
| `python scripts/felo.py feature --list` / `feature <handle> --line "..."` | Changes which collection leads the home page. |
| `python scripts/felo.py ship [-m "msg"]` | Refresh, then check, then commit (and push if a remote exists). Without `-m` it stops before committing. |

## Workflow A: refresh, check, ship

1. Run `git status` in the repo. If there are uncommitted changes you didn't make, ask before shipping them.
2. Run `python scripts/felo.py refresh`, then `python scripts/felo.py check`. Fix every **error**; don't silence the check. Read the **warnings** out to the user as a to-do list.
3. Start `python scripts/felo.py serve` in the background if it isn't running. Open http://localhost:5173 in the browser pane.
4. Paste `.claude/skills/felo-site/sweep.js` into the browser pane's JavaScript tool. Every row must start with ✓. For any ✗, fix it and run the sweep again.
5. Take screenshots of the home page at the pane's width, then with `resize_window` at 1280×860 and at the mobile preset. Reset to `desktop` afterwards.
   - The emulated-size screenshot can lag; reload the page if it looks stale.
   - Look for text overlapping text, empty sections, photos cropped oddly, or the lead collection not showing first.
6. Ship: `python scripts/felo.py ship -m "<subject>"`. The message is a subject line plus a sentence of why. End it with the co-author line this session uses.
7. Tell the user what changed, what you verified, and what still waits on Tyler.

## Workflow B: brand and wording review

1. Run `python scripts/felo.py brand`. Errors mean banned hype words, colours outside the palette, or gradients.
2. Read the visible wording yourself. The script only catches listed words. Look for:
   - **Invented facts.** Anything not backed by his YouTube bio, the product data, or something Tyler said. Remove it or mark it with `<span class="placeholder-note">Confirm with Tyler</span>`.
   - **First-person lines written as Tyler.**
   - **Hype or forced slang,** ALL-CAPS headlines, exclamation marks, or "gamer" clichés.
   - **Long sentences.** Keep it to one idea per sentence.
3. Look at screenshots of home, shop, a product, coaching and watch against the "Look" section of `brand/BRAND.md`. It should be black and white, have one red accent, put the product first, and use sentence-case Fraunces titles.
4. Report findings as `file:line: problem, then suggested wording`. Apply fixes only if the user asked for fixes, not just a review.
5. If a new hype word keeps coming up, add it to `banned_phrases` in `brand/brand.json`.

## Workflow C: feature a collection (new drop)

1. `python scripts/felo.py refresh`, so a brand-new collection exists in `site/data/products.json`.
2. `python scripts/felo.py feature --list` to see the handles.
3. `python scripts/felo.py feature <handle> --line "<one plain sentence: what it is>"`. The old lead drops to second place. Use `--second <handle>` to choose second place instead.
   - Tyler's favourites are `man-i-love-felo`, then `tfel-enterprises-premium`.
   - The home hero photo is the collection's first Shirt, or its first product if there's no Shirt.
4. Run `check`, look at the home page in the browser pane, then run Workflow A step 6 to ship.

## Where things live

- Products: `site/data/products.json`. Generated; don't hand-edit.
- Videos: `site/data/videos.json`. Generated; don't hand-edit.
- Lead collections and social links: `site/data/site.json`.
- Coaching packages, prices, open times and FAQ: `site/data/coaching.json`.
  - `availability.status` is `open`, `waitlist` or `closed`.
  - Slots are ISO times with an offset.
- Brand rules: `brand/BRAND.md` (for people) and `brand/brand.json` (read by the checker).
- The two outside connections, still to wire up:
  - `checkout()` in `site/js/store.js`.
  - `send()` in `site/js/forms.js`.
- Don't touch these unless the user asks to connect checkout or forms.

## Known limits

- `sync-videos.py` reads YouTube's channel page. If YouTube changes that page, the script keeps the old list and says so. The lasting fix is a YouTube Data API key.
- The Twitch player and chat only load when the site is served from a domain or localhost, not when a file is opened from disk.
- The site's own chat room is future work and needs a server. The Twitch chat embed covers it for now.
