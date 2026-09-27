// Puts the same header and footer on every page, so they're edited in one place.
// Each page has <div data-site-header></div> and <div data-site-footer></div>, and
// <body data-page="..."> tells us which nav link to mark as current.
import { cartCount, getSite, orderedCollections } from "./store.js";
import { wireForm } from "./forms.js";
import { esc } from "./ui.js";

const page = document.body.dataset.page || "";
const params = new URLSearchParams(location.search);
const current = (name) => (page === name ? ' aria-current="page"' : "");

const header = `
<div class="site-top">
	<header class="site-header">
		<div class="wrap site-header__bar">
			<details class="mobile-menu">
				<summary aria-label="Menu"><span></span><span></span></summary>
				<nav class="mobile-menu__panel" aria-label="Main menu" data-nav-mobile>
					<a href="shop.html">Shop all</a>
					<a href="watch.html">Watch</a>
					<a href="coaching.html">Coaching</a>
					<a href="about.html">About</a>
					<a href="help.html">Help</a>
					<a href="contact.html">Contact</a>
				</nav>
			</details>
			<a class="logo" href="index.html" aria-label="FeLo home"><span class="logo__text">FeLo</span></a>
			<nav class="main-nav" aria-label="Main menu" data-nav>
				<a href="shop.html"${page === "shop" && !params.get("c") ? ' aria-current="page"' : ""}>Shop all</a>
				<a href="watch.html"${current("watch")}>Watch</a>
				<a href="coaching.html"${current("coaching")}>Coaching</a>
				<a href="about.html"${current("about")}>About</a>
			</nav>
			<div class="site-header__icons">
				<a href="help.html" class="hide-sm"${current("help")}>Help</a>
				<a class="cart-link" href="cart.html"${current("cart")}>Cart <span class="cart-count" data-cart-count>(0)</span></a>
			</div>
		</div>
	</header>
</div>`;

const footer = `
<footer class="site-footer">
	<div class="wrap site-footer__grid">
		<div class="site-footer__brand">
			<span class="logo__text">FeLo</span>
			<p>Merch, coaching and streams from TFeL Enterprises.</p>
			<form class="inline-form" data-alerts-form>
				<div class="field">
					<label class="visually-hidden" for="AlertsEmail">Email for new drops</label>
					<input id="AlertsEmail" type="email" name="email" placeholder="Email for new drops" autocomplete="email" required>
				</div>
				<button type="submit" class="btn btn--light">Sign up</button>
			</form>
			<div class="form__done" hidden>
				<strong>You're signed up</strong>
				<p>We'll email you when new pieces drop.</p>
				<p class="meta" data-not-connected>Test mode: not connected to an email list yet.</p>
			</div>
		</div>
		<nav class="site-footer__menu" aria-label="Shop">
			<h2 class="label">Shop</h2>
			<a href="shop.html">All products</a>
			<div class="site-footer__menu" data-collections-footer></div>
		</nav>
		<nav class="site-footer__menu" aria-label="FeLo">
			<h2 class="label">FeLo</h2>
			<a href="watch.html">Watch</a>
			<a href="coaching.html">Coaching</a>
			<a href="about.html">About</a>
			<div class="site-footer__menu" data-socials></div>
		</nav>
		<nav class="site-footer__menu" aria-label="Help">
			<h2 class="label">Help</h2>
			<a href="help.html">FAQ</a>
			<a href="help.html#shipping">Shipping</a>
			<a href="help.html#returns">Returns</a>
			<a href="help.html#sizes">Sizes</a>
			<a href="contact.html">Contact</a>
		</nav>
	</div>
	<div class="wrap site-footer__base">
		<span>&copy; ${new Date().getFullYear()} TFeL Enterprises</span>
		<span>Prices in USD</span>
	</div>
</footer>`;

function swap(selector, html) {
	const el = document.querySelector(selector);
	if (!el) return;
	el.insertAdjacentHTML("afterend", html);
	el.remove();
}
swap("[data-site-header]", header);
swap("[data-site-footer]", footer);

function updateCount() {
	const n = cartCount();
	document.querySelectorAll("[data-cart-count]").forEach((el) => {
		el.textContent = `(${n})`;
		el.classList.toggle("has-items", n > 0);
	});
}
updateCount();
window.addEventListener("cart:change", updateCount);

// Close the mobile menu when clicking elsewhere or pressing Escape.
document.addEventListener("click", (e) => {
	document.querySelectorAll("details.mobile-menu[open]").forEach((d) => !d.contains(e.target) && d.removeAttribute("open"));
});
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") document.querySelectorAll("details.mobile-menu[open]").forEach((d) => d.removeAttribute("open"));
});

export function socialLinks(channels) {
	return [
		channels.twitch && ["Twitch", `https://twitch.tv/${channels.twitch}`],
		channels.youtube && ["YouTube", channels.youtube],
		channels.tiktok && ["TikTok", channels.tiktok],
		channels.x && ["X", channels.x],
	].filter(Boolean);
}

Promise.all([getSite(), orderedCollections()])
	.then(([site, cols]) => {
		// The two lead collections get their own nav links, ahead of "Shop all".
		const lead = [site.featured, site.second].filter(Boolean);
		const navLink = (f) => {
			const here = page === "shop" && params.get("c") === f.collection ? ' aria-current="page"' : "";
			return `<a href="shop.html?c=${encodeURIComponent(f.collection)}"${here}>${esc(f.title)}</a>`;
		};
		document.querySelector("[data-nav]").insertAdjacentHTML("afterbegin", lead.map(navLink).join(""));
		document.querySelector("[data-nav-mobile]").insertAdjacentHTML("afterbegin", lead.map(navLink).join(""));

		document.querySelector("[data-collections-footer]").outerHTML = cols
			.map((c) => `<a href="shop.html?c=${encodeURIComponent(c.handle)}">${esc(c.title)}</a>`)
			.join("");
		document.querySelector("[data-socials]").outerHTML = socialLinks(site.channels)
			.map(([name, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${name} ↗</a>`)
			.join("");
	})
	.catch(() => {
		// Menus still have their fixed links; the page itself shows any loading error.
	});

const alertsForm = document.querySelector("[data-alerts-form]");
if (alertsForm) wireForm(alertsForm, "drop-alerts");
