// Puts the same header, drop-alerts band and footer on every page, so they're edited in one place.
// Each page has <div data-site-header></div> and <div data-site-footer></div>, and
// <body data-page="..."> tells us which nav link to highlight.
import { cartCount, getCollections } from "./store.js";
import { wireForm } from "./forms.js";
import { esc } from "./ui.js";

export const SOCIAL = {
	youtube: "https://www.youtube.com/user/TylerJ515",
	tiktok: "https://tiktok.com/@tylerfelo",
	x: "https://x.com/FeLo",
};

const page = document.body.dataset.page || "";
const current = (name) => (page === name ? ' aria-current="page"' : "");

const header = `
<div class="site-top">
	<div class="promo"><a href="shop.html?c=tfel-enterprises-skyline">The Skyline collection is out now</a></div>
	<header class="site-header">
		<div class="wrap site-header__bar">
			<details class="mobile-menu">
				<summary aria-label="Menu"><span></span><span></span></summary>
				<nav class="mobile-menu__panel" aria-label="Main menu">
					<a href="shop.html">Shop all</a>
					<div data-collections-mobile></div>
					<a href="coaching.html">Coaching</a>
					<a href="about.html">About</a>
					<a href="help.html">Help</a>
					<a href="contact.html">Contact</a>
				</nav>
			</details>
			<nav class="main-nav" aria-label="Main menu">
				<a href="shop.html"${current("shop")}>Shop</a>
				<details class="drop">
					<summary>Collections</summary>
					<ul class="drop__list" data-collections-menu><li><a href="shop.html">All products</a></li></ul>
				</details>
				<a href="coaching.html" class="nav-hot"${current("coaching")}>Coaching</a>
				<a href="about.html"${current("about")}>About</a>
				<a href="help.html"${current("help")}>Help</a>
			</nav>
			<a class="logo" href="index.html" aria-label="FeLo home"><span class="logo__text">FeLo</span></a>
			<div class="site-header__icons">
				<a href="contact.html" aria-label="Contact"${current("contact")}>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
				</a>
				<a class="cart-link" href="cart.html"${current("cart")}>Cart <span class="cart-count" data-cart-count>0</span></a>
			</div>
		</div>
	</header>
</div>`;

const footer = `
<section class="alerts" aria-labelledby="alerts-title">
	<div class="wrap">
		<div>
			<h2 id="alerts-title">Drop alerts</h2>
			<p>New collections sell through fast. Get an email the moment the next one goes live.</p>
		</div>
		<div>
			<form class="inline-form" data-alerts-form>
				<div class="field" style="flex: 1 1 240px">
					<label class="visually-hidden" for="AlertsEmail">Email</label>
					<input id="AlertsEmail" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
				</div>
				<button type="submit" class="btn">Notify me</button>
			</form>
			<div class="form__done" hidden>
				<strong>You're on the list</strong>
				<p>We'll email you when the next drop goes live.</p>
				<p class="meta" data-not-connected>Test mode: drop alerts aren't connected to an email service yet.</p>
			</div>
		</div>
	</div>
</section>
<footer class="site-footer">
	<div class="wrap site-footer__grid">
		<div class="site-footer__brand">
			<span class="logo__text">FeLo</span>
			<p>Official merch and coaching from TFeL Enterprises.</p>
			<div class="social">
				<a href="${SOCIAL.youtube}" target="_blank" rel="noopener">YouTube</a>
				<a href="${SOCIAL.tiktok}" target="_blank" rel="noopener">TikTok</a>
				<a href="${SOCIAL.x}" target="_blank" rel="noopener">X</a>
			</div>
		</div>
		<nav class="site-footer__menu" aria-label="Shop">
			<h2 class="label">Shop</h2>
			<a href="shop.html">All products</a>
			<div class="site-footer__menu" data-collections-footer></div>
		</nav>
		<nav class="site-footer__menu" aria-label="Info">
			<h2 class="label">Info</h2>
			<a href="coaching.html">Coaching</a>
			<a href="about.html">About FeLo</a>
			<a href="help.html">Help and FAQ</a>
			<a href="help.html#shipping">Shipping</a>
			<a href="help.html#returns">Returns</a>
			<a href="contact.html">Contact</a>
		</nav>
	</div>
	<div class="wrap site-footer__base">
		<span>&copy; ${new Date().getFullYear()} TFeL Enterprises</span>
		<span>Prices in USD</span>
	</div>
</footer>`;

document.querySelector("[data-site-header]")?.insertAdjacentHTML("afterend", header);
document.querySelector("[data-site-header]")?.remove();
document.querySelector("[data-site-footer]")?.insertAdjacentHTML("afterend", footer);
document.querySelector("[data-site-footer]")?.remove();

function updateCount() {
	document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cartCount()));
}
updateCount();
window.addEventListener("cart:change", updateCount);

// Only one header dropdown open at a time; clicking elsewhere closes it.
document.addEventListener("click", (e) => {
	document.querySelectorAll("details.drop[open], details.mobile-menu[open]").forEach((d) => {
		if (!d.contains(e.target)) d.removeAttribute("open");
	});
});
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") document.querySelectorAll("details.drop[open], details.mobile-menu[open]").forEach((d) => d.removeAttribute("open"));
});

getCollections()
	.then((cols) => {
		const params = new URLSearchParams(location.search);
		const link = (c) => `shop.html?c=${encodeURIComponent(c.handle)}`;
		document.querySelector("[data-collections-menu]").innerHTML =
			`<li><a href="shop.html">All products</a></li>` +
			cols.map((c) => `<li><a href="${link(c)}"${params.get("c") === c.handle ? ' aria-current="page"' : ""}>${esc(c.title)} <small>${c.count}</small></a></li>`).join("");
		document.querySelector("[data-collections-mobile]").outerHTML = cols
			.map((c) => `<a class="mobile-menu__child" href="${link(c)}">${esc(c.title)}</a>`)
			.join("");
		document.querySelector("[data-collections-footer]").outerHTML = cols.map((c) => `<a href="${link(c)}">${esc(c.title)}</a>`).join("");
	})
	.catch(() => {
		// The menus still have "All products"; the page itself shows the loading error.
	});

const alertsForm = document.querySelector("[data-alerts-form]");
if (alertsForm) wireForm(alertsForm, "drop-alerts");
