// Everything about products, the cart and checkout goes through this file.
// Today it reads data/products.json (copied from tfelent.com by scripts/sync-products.py)
// and keeps the cart in the visitor's browser. When we pick a checkout (Shopify or Stripe),
// only checkout() below needs to change: the rest of the site never talks to a store directly.

export const SETTINGS = {
	currency: "USD",
	// Set a number (in dollars) to show a free-shipping progress bar in the cart. null hides it.
	freeShippingOver: null,
};

const CART_KEY = "felo-cart-v1";
let catalogPromise;

export function getCatalog() {
	catalogPromise ??= fetch("data/products.json").then((r) => {
		if (!r.ok) throw new Error(`products.json failed to load (${r.status})`);
		return r.json();
	});
	return catalogPromise;
}

// Site settings: which collection leads the home page, social links. Edited by scripts/feature.py.
let sitePromise;
export function getSite() {
	sitePromise ??= fetch("data/site.json").then((r) => {
		if (!r.ok) throw new Error(`site.json failed to load (${r.status})`);
		return r.json();
	});
	return sitePromise;
}

// Collections in the order the site shows them: featured, second, then everything else.
export async function orderedCollections() {
	const [{ collections }, site] = await Promise.all([getCatalog(), getSite()]);
	const first = [site.featured?.collection, site.second?.collection].filter(Boolean);
	const rank = (c) => (first.includes(c.handle) ? first.indexOf(c.handle) : first.length + collections.indexOf(c));
	return [...collections].sort((a, b) => rank(a) - rank(b));
}

export async function getProducts() {
	return (await getCatalog()).products;
}

export async function getProduct(handle) {
	return (await getProducts()).find((p) => p.handle === handle) || null;
}

export async function getCollections() {
	return (await getCatalog()).collections;
}

/* ---------- Small product helpers used by several pages ---------- */

export const money = (amount) =>
	new Intl.NumberFormat("en-US", { style: "currency", currency: SETTINGS.currency }).format(Number(amount));

export const shortTitle = (title) => title.replace("TFeL Enterprises ", "").replace(" City Skyline", " Skyline");

// Shopify's image CDN resizes on the fly when you add ?width=.
export function sized(src, width) {
	if (!src) return "";
	const url = new URL(src, location.href);
	url.searchParams.set("width", width);
	return url.toString();
}

export function optionIndex(product, name) {
	return product.options.findIndex((o) => o.name.toLowerCase() === name);
}
export function colourOption(product) {
	const i = Math.max(optionIndex(product, "color"), optionIndex(product, "colour"));
	return i >= 0 ? product.options[i] : null;
}
export function sizeOption(product) {
	const i = optionIndex(product, "size");
	return i >= 0 ? product.options[i] : null;
}
export function sizeRange(product) {
	const s = sizeOption(product);
	if (!s) return "One size";
	return s.values.length > 1 ? `${s.values[0]}–${s.values[s.values.length - 1]}` : s.values[0];
}
export function lowestPrice(product) {
	return Math.min(...product.variants.map((v) => Number(v.price)));
}
export function priceVaries(product) {
	return new Set(product.variants.map((v) => v.price)).size > 1;
}
export function isAvailable(product) {
	return product.variants.some((v) => v.available);
}
export function findVariantById(product, id) {
	return product.variants.find((v) => String(v.id) === String(id));
}

/* ---------- Cart (kept in this browser until a real store is connected) ---------- */

function readCart() {
	try {
		const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
		return Array.isArray(raw) ? raw : [];
	} catch {
		return [];
	}
}
function writeCart(lines) {
	try {
		localStorage.setItem(CART_KEY, JSON.stringify(lines));
	} catch {
		// Private windows can block storage; the cart then lasts only for this page view.
	}
	memoryCart = lines;
	window.dispatchEvent(new CustomEvent("cart:change", { detail: { count: cartCount() } }));
}
let memoryCart = readCart();

export function cartLines() {
	return memoryCart.map((l) => ({ ...l }));
}
export function cartCount() {
	return memoryCart.reduce((n, l) => n + l.qty, 0);
}
export function addToCart(handle, variantId, qty = 1) {
	const lines = cartLines();
	const line = lines.find((l) => String(l.variantId) === String(variantId));
	if (line) line.qty += qty;
	else lines.push({ handle, variantId, qty });
	writeCart(lines);
}
export function setQty(variantId, qty) {
	const lines = cartLines()
		.map((l) => (String(l.variantId) === String(variantId) ? { ...l, qty } : l))
		.filter((l) => l.qty > 0);
	writeCart(lines);
}
export function removeLine(variantId) {
	setQty(variantId, 0);
}

// Joins the saved lines with live product data. Lines whose product was removed from the store are dropped.
export async function cartDetails() {
	const products = await getProducts();
	const lines = [];
	for (const l of memoryCart) {
		const product = products.find((p) => p.handle === l.handle);
		const variant = product && findVariantById(product, l.variantId);
		if (!variant) continue;
		const image = variant.image || product.images[0]?.src;
		lines.push({ ...l, product, variant, image, lineTotal: Number(variant.price) * l.qty });
	}
	const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
	return { lines, subtotal };
}

/* ---------- Checkout: the one piece left to connect ---------- */

// Returns { ok, url?, message }.
// Shopify later: create a cart with the Storefront API (cartCreate, lines = variant ids + quantities)
//   and send the visitor to the checkoutUrl it returns.
// Stripe later: POST the lines to a small server function that creates a Checkout Session.
export async function checkout() {
	const { lines } = await cartDetails();
	if (!lines.length) return { ok: false, message: "Your cart is empty." };
	return {
		ok: false,
		message: "Checkout isn't open yet. Your cart is saved on this device, so it'll be here when it is.",
	};
}
