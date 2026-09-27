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
