import "../layout.js";
import { getCatalog, getSite, sized } from "../store.js";
import { esc, loadError, productCard, skeletonCards } from "../ui.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const featureGrid = $("[data-feature-grid]");
const secondGrid = $("[data-second-grid]");
featureGrid.innerHTML = skeletonCards(5);
secondGrid.innerHTML = skeletonCards(3);

Promise.all([getCatalog(), getSite()])
	.then(([{ collections, products }, site]) => {
		const inCol = (handle) => products.filter((p) => p.collection === handle);
		const shopLink = (handle) => `shop.html?c=${encodeURIComponent(handle)}`;

		// Lead collection: hero photo is its first product (the M.I.L.F tee today), then the full row.
		const f = site.featured;
		const fItems = inCol(f.collection);
		const hero = fItems.find((p) => p.type === "Shirt") || fItems[0];
		$("[data-feature-title]").textContent = f.title;
		$("[data-feature-heading]").textContent = `The full ${f.title} collection`;
		$("[data-feature-line]").textContent = f.line || "";
		$$("[data-feature-link]").forEach((a) => (a.href = shopLink(f.collection)));
		if (hero?.images[0]) {
			const src = hero.images[0].src;
			$("[data-feature-pic]").innerHTML =
				`<a href="product.html?p=${encodeURIComponent(hero.handle)}"><img src="${sized(src, 1000)}" srcset="${sized(src, 700)} 700w, ${sized(src, 1000)} 1000w, ${sized(src, 1400)} 1400w" sizes="(min-width: 900px) 55vw, 100vw" alt="${esc(hero.title)}"></a>`;
		}
		featureGrid.innerHTML = fItems.map(productCard).join("");

		const s = site.second;
		if (s) {
			$("[data-second-title]").textContent = s.title;
			$("[data-second-line]").textContent = s.line || "";
			$("[data-second-link]").href = shopLink(s.collection);
			secondGrid.innerHTML = inCol(s.collection).slice(0, 3).map(productCard).join("");
		} else {
			$(".band").hidden = true;
		}

		$("[data-more]").innerHTML = (site.more || [])
			.map((handle) => {
				const c = collections.find((x) => x.handle === handle);
				const img = inCol(handle)[0]?.images[0]?.src;
				if (!c) return "";
				return `
					<a class="col-card" href="${shopLink(handle)}">
						<div class="col-card__pic">${img ? `<img src="${sized(img, 600)}" alt="" loading="lazy">` : ""}</div>
						<b>${esc(c.title)}</b>
						<span>${c.count} piece${c.count === 1 ? "" : "s"}</span>
					</a>`;
			})
			.join("");
	})
	.catch(() => {
		loadError(featureGrid, "products");
		secondGrid.innerHTML = "";
	});

// Live banner: load Twitch's embed player out of sight and show the section only when it reports ONLINE.
// No API key needed. Twitch requires the page's domain as "parent", so this skips files opened from disk.
function watchLive(channel) {
	if (!location.hostname) return;
	const section = $("[data-live]");
	const s = document.createElement("script");
	s.src = "https://player.twitch.tv/js/embed/v1.js";
	s.onload = () => {
		const player = new window.Twitch.Player("live-player", {
			channel,
			parent: [location.hostname],
			width: "100%",
			height: "100%",
			muted: true,
			autoplay: true,
		});
		player.addEventListener(window.Twitch.Player.ONLINE, () => (section.hidden = false));
		player.addEventListener(window.Twitch.Player.OFFLINE, () => (section.hidden = true));
	};
	document.head.appendChild(s);
}
getSite()
	.then((site) => site.channels?.twitch && watchLive(site.channels.twitch))
	.catch(() => {});

// One-click social buttons under the company name. Links come from data/site.json.
// Icons are simplified brand marks drawn in the page's ink colour.
const ICONS = {
	Twitch: '<path d="M4 2 2.5 6v14h5v3h3l3-3h4l5-5V2H4Zm16.5 12-3 3h-5l-3 3v-3H5V4h15.5v10ZM17 7.5h-2v5h2v-5Zm-5 0h-2v5h2v-5Z"/>',
	YouTube: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9L15.4 12l-5.7 3.1Z"/>',
	TikTok: '<path d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.7 1.5V6.7a4.7 4.7 0 0 1-4.7-4.7Z"/>',
	X: '<path d="M17.8 2.5h3.3l-7.2 8.2 8.5 11.3h-6.6l-5.2-6.8-6 6.8H1.3l7.7-8.8L.9 2.5h6.8l4.7 6.2 5.4-6.2Zm-1.2 17.5h1.8L7.2 4.4H5.2L16.6 20Z"/>',
};
getSite()
	.then(async (site) => {
		const { socialLinks } = await import("../layout.js");
		const el = $("[data-socials-home]");
		if (!el) return;
		el.innerHTML = socialLinks(site.channels)
			.map(
				([name, url]) =>
					`<a class="social-btn" href="${esc(url)}" target="_blank" rel="noopener" aria-label="FeLo on ${name}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">${ICONS[name] || ""}</svg><span>${name}</span></a>`,
			)
			.join("");
	})
	.catch(() => {});
