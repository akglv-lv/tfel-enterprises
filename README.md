# FeLo website

The website for FeLo / TFeL Enterprises: merch, gaming coaching, About, Help and Contact.
It's a dark, night-time look built around the Skyline collection. On the home page, a drawn city skyline changes colour for each Skyline colourway.

This repo holds two things:

- **`site/`**: the main website, in plain HTML, CSS and JavaScript. It works now; checkout and the forms get connected at the end.
- **`theme/`**: a Shopify theme with the same look, kept as a backup in case we decide to run the site inside Shopify instead.

## The website (`site/`)

### Preview it

```
python -m http.server 5173 --directory site
```

Then open http://localhost:5173. Pages must be served like this rather than double-clicked, because they load their data with `fetch`.

### Pages

| Page | What it does |
| --- | --- |
| `index.html` | Skyline hero, collection tiles, Skyline and Premium grids, coaching teaser |
| `shop.html` | Every product. Filters live in the URL, so links like `shop.html?c=b2a&t=Hoodie` can be shared |
| `product.html?p=<handle>` | Photos per colour, colour swatches, sizes (sold-out ones crossed out), add to cart |
| `cart.html` | Change quantities, remove items, subtotal, checkout button |
| `coaching.html` | Gaming coaching: packages, how it works, application form, FAQ |
| `about.html`, `help.html`, `contact.html`, `404.html` | About FeLo; FAQ, shipping, returns and sizes; contact form; not found |

Every page shares one header, drop-alerts band and footer from `js/layout.js`.

### Where to change things

- **Products**: run `python scripts/sync-products.py`. It copies the live product list from tfelent.com into `site/data/products.json`.
- **Coaching packages, prices, steps and FAQ**: `site/data/coaching.json`. Set `price` to a number to show it.
- **Colours and fonts**: the top of `site/css/site.css`.
- **Anything with a yellow "Confirm with Tyler" or "Draft text" tag** is placeholder wording to replace.

### What's left to connect (at the end)

Only two files talk to the outside world, so connecting means editing just these:

- **`site/js/store.js` → `checkout()`**: today it shows "Checkout isn't open yet".
  - With Shopify: create a cart through the Storefront API using the variant ids already in `products.json`, then send the visitor to its `checkoutUrl`.
  - Without Shopify: send the cart to a small Stripe Checkout function, and pass orders to Printful.
- **`site/js/forms.js` → `send()`**: the coaching application, contact and drop-alert forms.
  - Forms can go to Formspree or Netlify Forms.
  - Drop alerts can go to a mailing tool such as Mailchimp or Klaviyo.
  - Coaching can also link to Calendly for booking.

Hosting: `site/` is a plain folder, so Netlify, Cloudflare Pages or GitHub Pages can serve it for free. Then point the domain at it.

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
