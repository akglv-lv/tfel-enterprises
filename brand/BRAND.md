# FeLo / TFeL Enterprises: brand rules

Short version: **black and white, the clothes do the talking, say things plainly.**

## Look
- **Colours:** white page, near-black ink, grey for secondary text. One accent, **M.I.L.F red `#D2231F`**, used for small things only: sale and sold-out tags, the cart count, hover. Black bands (`#0E0E0E`) set off the Premium section, coaching and the footer.
- **No** gradients, neon, glows or purple/pink. That was the old look, and it read as cringey.
- **Type:**
  - **Fraunces**, heavy and soft, for titles only, in sentence case. It echoes the retro lettering on the M.I.L.F tee.
  - **Geist** for everything else.
  - **Geist Mono** for prices and small labels.
  - No stretched all-caps headlines.
- **Photos:** product shots are on white, so show them on white with no boxes or borders around them.
- The exact colour list lives in `brand/brand.json`. `scripts/check-site.py` flags any colour in the site that isn't on it.

## Voice
- Short, plain sentences. Say what the thing is and what it costs.
- No hype words. `brand/brand.json` has the banned list ("insane", "level up", "next level"…), and the check script flags them. Tyler's own video titles are his business. This rule is for the site's own wording.
- Don't write in first person as Tyler. Say "FeLo" or "he" unless Tyler wrote the words himself.
- **Only state facts we can back up:**
  - His YouTube bio: a competitive Call of Duty player for 11 years, streaming daily on Twitch.
  - The store's product data.
  - The "made when you order" line from the product descriptions.
  - Anything else gets a yellow `placeholder-note` tag ("Confirm with Tyler") until he confirms it.

## Lead collections
Tyler's favourites are **Man I Love FeLo** (featured) and **TFeL Enterprises Premium** (second). Change them with `python scripts/felo.py feature <handle>`, never by editing page code.
