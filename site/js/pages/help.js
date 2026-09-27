import "../layout.js";
import { getProducts, sizeOption } from "../store.js";
import { esc } from "../ui.js";

// Builds the size table from the real catalogue, so it can never disagree with the shop.
const TYPES = ["Shirt", "Hoodie", "Crewneck", "Tank Top", "Hat"];
const body = document.querySelector("[data-size-table]");

getProducts()
	.then((products) => {
		body.innerHTML = TYPES.map((type) => {
			const list = products.filter((p) => p.type === type);
			if (!list.length) return "";
			const sizes = new Set();
			list.forEach((p) => sizeOption(p)?.values.forEach((v) => sizes.add(v)));
			const text = sizes.size ? [...sizes].join(", ") : "One size (adjustable)";
			return `<tr><td>${esc(type)}s</td><td>${esc(text)}</td><td><a href="shop.html?t=${encodeURIComponent(type)}">${list.length}</a></td></tr>`;
		}).join("");
	})
	.catch(() => {
		body.innerHTML = `<tr><td colspan="3">Couldn't load sizes. Refresh to try again.</td></tr>`;
	});
