// Small shared pieces: escaping, the toast, quantity buttons and the product card.
import { colourOption, isAvailable, lowestPrice, money, priceVaries, shortTitle, sized, sizeRange } from "./store.js";

export const esc = (s) =>
	String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let toastTimer;
export function toast(html) {
	let el = document.getElementById("toast");
	if (!el) {
		el = document.createElement("div");
		el.id = "toast";
		el.className = "toast";
		el.setAttribute("role", "status");
		el.setAttribute("aria-live", "polite");
		document.body.appendChild(el);
	}
	el.innerHTML = html;
	el.hidden = false;
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => (el.hidden = true), 3400);
}

// Plus and minus buttons next to any quantity box, anywhere on the site.
document.addEventListener("click", (e) => {
	const btn = e.target.closest("[data-qty]");
	if (!btn) return;
	const input = btn.parentElement.querySelector("input[type=number]");
	const min = Number(input.min || 0);
	input.value = Math.max(min, Number(input.value || 0) + Number(btn.dataset.qty));
	input.dispatchEvent(new Event("change", { bubbles: true }));
});

// Only tags that change a buying decision. Collection names are already on the page around the card.
export function ribbonFor(product) {
	if (!isAvailable(product)) return "Sold out";
	if (product.variants.some((x) => x.compare_at_price && Number(x.compare_at_price) > Number(x.price))) return "Sale";
	return "";
}

export function productCard(product) {
	const colours = colourOption(product)?.values.length || 0;
	const img = product.images[0]?.src;
	const ribbon = ribbonFor(product);
	return `
		<a class="card" href="product.html?p=${encodeURIComponent(product.handle)}">
			<div class="card__pic">
				${ribbon ? `<span class="ribbon ribbon--red">${ribbon}</span>` : ""}
				${img ? `<img src="${sized(img, 600)}" srcset="${sized(img, 400)} 400w, ${sized(img, 600)} 600w, ${sized(img, 900)} 900w" sizes="(min-width: 1100px) 300px, (min-width: 560px) 33vw, 50vw" alt="${esc(product.title)}" loading="lazy">` : ""}
			</div>
			<div class="card__row">
				<h3 class="card__title">${esc(shortTitle(product.title))}</h3>
				<span class="price">${priceVaries(product) ? "From " : ""}${money(lowestPrice(product))}</span>
			</div>
			<span class="card__sub">${colours ? `${colours} colour${colours === 1 ? "" : "s"} · ` : ""}${sizeRange(product)}</span>
		</a>`;
}

export function skeletonCards(n) {
	return Array.from({ length: n }, () => `<div class="card card--skeleton" aria-hidden="true"><div class="card__pic"></div></div>`).join("");
}

export function loadError(el, what) {
	el.innerHTML = `<p class="empty">Couldn't load ${what}. Refresh the page to try again.</p>`;
}
