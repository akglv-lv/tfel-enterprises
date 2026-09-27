# FeLo website

The website for FeLo / TFeL Enterprises: merch, Call of Duty coaching, streams and videos, About, Help and Contact.
It's black and white, built around Tyler's favourite collections: Man I Love FeLo (featured) and TFeL Enterprises Premium. The brand rules are in [`brand/BRAND.md`](brand/BRAND.md).

This repo holds two things:

- **`docs/`**: the main website, in plain HTML, CSS and JavaScript. It works now; checkout and the forms get connected at the end.
- **`theme/`**: an older Shopify theme, kept as a backup in case we decide to run the site inside Shopify instead.

## Day-to-day: one command

Everything runs through `scripts/felo.py` (Python 3 and git only):

| Command | Does |
| --- | --- |
| `python scripts/felo.py serve` | Preview at http://localhost:5173 (caching off, so edits show on refresh) |
| `python scripts/felo.py refresh` | Pull the latest products (tfelent.com) and videos (YouTube) |
| `python scripts/felo.py check` | Every check: broken links, bad data, hype words, off-brand colours, plus a to-do list of what's waiting on Tyler |
| `python scripts/felo.py brand` | Only the wording and colour checks |
| `python scripts/felo.py feature --list` | See the collections and which ones lead the home page |
| `python scripts/felo.py feature <handle> --line "..."` | Make a collection lead the home page (for a new drop) |
| `python scripts/felo.py ship -m "message"` | Refresh, check, then commit (push too, once a remote exists). Without `-m` it stops before committing |

With Claude Code, the **`/felo-site`** skill (`.claude/skills/felo-site/`) runs the same steps and adds a visual check of every page at desktop and phone width, plus a wording review.

## The website (`docs/`)

### Pages

| Page | What it does |
| --- | --- |
| `index.html` | Featured collection (Man I Love FeLo), its full row, Premium band, more collections, coaching strip |
| `shop.html` | Every product. Collection tabs, type chips, search and sort, all kept in the URL, so links like `shop.html?c=man-i-love-felo&t=Hoodie` can be shared |
| `product.html?p=<handle>` | Photos per colour, colour swatches, sizes (sold-out ones crossed out), add to cart |
| `cart.html` | Change quantities, remove items, subtotal, checkout button |
| `watch.html` | Twitch stream and chat embedded, latest YouTube videos (play in place), TikTok link |
| `coaching.html` | Call of Duty coaching: availability, packages, how it works, application form, FAQ |
| `about.html`, `help.html`, `contact.html`, `404.html` | About FeLo; FAQ, shipping, returns and sizes; contact form; not found |

Every page shares one header and footer from `js/layout.js`.

### Where to change things

| What | Where |
| --- | --- |
| Products | `python scripts/felo.py refresh` (writes `docs/data/products.json`; don't hand-edit) |
| Videos | Same command (writes `docs/data/videos.json`) |
| Which collections lead, social links, Twitch channel | `docs/data/site.json`, or `felo.py feature` |
| Coaching packages, prices, open times, FAQ | `docs/data/coaching.json` |
| Colours and fonts | Top of `docs/css/site.css`, and the palette in `brand/brand.json` |
| Banned hype words | `brand/brand.json` |

Anything with a yellow "Confirm with Tyler" or "Draft" tag is placeholder wording. `felo.py check` lists them all.

### Still to build

- **Chat room:** the Watch page embeds Twitch chat for now. A site-only chat needs a server or a hosted chat service.

### What's left to connect (at the end)

Only two files talk to the outside world, so connecting means editing just these:

- **`docs/js/store.js` → `checkout()`**: today it shows "Checkout isn't open yet".
  - With Shopify: create a cart through the Storefront API using the variant ids already in `products.json`, then send the visitor to its `checkoutUrl`.
  - Without Shopify: send the cart to a small Stripe Checkout function, and pass orders to Printful.
- **`docs/js/forms.js` → `send()`**: the coaching application, contact and drop-alert forms.
  - Forms can go to Formspree or Netlify Forms.
  - Drop alerts can go to a mailing tool such as Mailchimp or Klaviyo.
  - Coaching can also link to Calendly for booking.

Hosting: `docs/` is a plain folder, so Netlify, Cloudflare Pages or GitHub Pages can serve it for free. Then point the domain at it.

---

# Shopify theme backup (`theme/`)

A custom Shopify theme for [tfelent.com](https://tfelent.com) with the same look. It's only used if we decide to run the site inside Shopify.

## What's in `theme/`

| Folder | What it holds |
| --- | --- |
| `layout/` | The page wrapper (`theme.liquid`) and the password page wrapper |
| `templates/` | Which sections each kind of page shows (home, product, collection, cart…) |
| `sections/` | The building blocks: skyline hero, collection tiles, product grid, product page, cart, header, footer |
| `snippets/` | The product card, colour-swatch names, share tags |
| `assets/` | `theme.css`, `theme.js` (product picker, add to cart), `skyline.js` (the hero drawing) |
| `config/` | Theme settings: accent colours, logo, social links |

## Try it on the store (no tools needed)

1. Run `scripts/build-zip.ps1`. It writes `dist/felo-skyline.zip`.
2. In Shopify admin, open **Online Store > Themes > Add theme > Upload zip file** and pick that zip.
3. The theme arrives **unpublished**. Click **Preview** to walk through it, or **Customize** to edit it.
4. In **Customize > Theme settings > Logo**, upload the FeLo logo. The theme is dark, so leave "Turn a black logo white" on for the current black logo.
5. Publish only when Tyler is happy with it. The old theme stays in the theme library, so you can switch back at any time.

Uploading as a new theme never touches the live one.

## Working on it with live reload (optional)

The Shopify CLI shows edits on the real store as you save. It needs Node.js 18+.

```
npm install -g @shopify/cli
shopify theme dev --path theme --store tfelent
```

The store handle might not be `tfelent`: it's the part before `.myshopify.com` in the admin URL.
You'll need staff or collaborator access to the store.

## Things only the store owner can change

- **Menus**: the header uses the `main-menu` menu and the footer uses `footer` (Online Store > Navigation).
- **Filter chips on collection pages** come from the Search & Discovery app. Add *Product type* and *Color* filters there.
- **Free shipping bar in the cart**: set the amount in Customize > Cart. It only shows a bar. The real rule lives in Settings > Shipping.
- The old theme's X (Twitter) link pointed to `tfelent.com/x.com/FeLo`, which is broken. This theme uses `https://x.com/FeLo`.
