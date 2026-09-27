# FeLo Skyline theme

A custom Shopify theme for [tfelent.com](https://tfelent.com), the TFeL Enterprises merch store.
It's a dark, night-time look built around the Skyline collection. On the home page, a drawn city skyline changes colour for each Skyline colourway.

The store's products, collections, cart, checkout and orders all stay in Shopify. This repo is only the theme: how the store looks.

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
