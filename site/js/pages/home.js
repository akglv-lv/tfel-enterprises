import "../layout.js";
import { getCatalog } from "../store.js";
import { esc, loadError, productCard, skeletonCards } from "../ui.js";

const grids = [...document.querySelectorAll("[data-grid]")];
grids.forEach((g) => (g.innerHTML = skeletonCards(Number(g.dataset.limit))));

getCatalog()
	.then(({ collections, products }) => {
		document.querySelector("[data-tiles]").innerHTML = collections
			.map((c) => `<a class="tile" href="shop.html?c=${encodeURIComponent(c.handle)}"><b>${esc(c.title)}</b><small>${c.count} piece${c.count === 1 ? "" : "s"}</small></a>`)
			.join("");
		for (const g of grids) {
			const list = products.filter((p) => p.collection === g.dataset.grid).slice(0, Number(g.dataset.limit));
			g.innerHTML = list.map(productCard).join("");
		}
	})
	.catch(() => grids.forEach((g) => loadError(g, "products")));
