import "../layout.js";
import { colourOption, getCatalog, lowestPrice } from "../store.js";
import { esc, loadError, productCard, skeletonCards } from "../ui.js";

// Filters live in the URL (?c=collection&t=type&q=search&sort=...) so any view can be shared as a link.
const TYPES = ["Shirt", "Hoodie", "Crewneck", "Hat", "Tank Top"];
const params = new URLSearchParams(location.search);
const state = {
	c: params.get("c") || "",
	t: params.get("t") || "",
	q: params.get("q") || "",
	sort: params.get("sort") || "featured",
};

const grid = document.querySelector("[data-grid]");
const tiles = document.querySelector("[data-tiles]");
const types = document.querySelector("[data-types]");
const search = document.querySelector("[data-search]");
const sort = document.querySelector("[data-sort]");
const count = document.querySelector("[data-count]");
const title = document.querySelector("[data-title]");
search.value = state.q;
sort.value = state.sort;
grid.innerHTML = skeletonCards(8);

let catalog;

function syncUrl() {
	const p = new URLSearchParams();
	for (const [k, v] of Object.entries(state)) if (v && !(k === "sort" && v === "featured")) p.set(k, v);
	const qs = p.toString();
	history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

function render() {
	const { collections, products } = catalog;
	const col = collections.find((c) => c.handle === state.c);
	title.textContent = col ? col.title : "Shop all";
	document.title = `${col ? col.title : "Shop"} | FeLo`;

	tiles.innerHTML =
		`<button class="tile" type="button" data-c="" aria-pressed="${!state.c}"><b>Everything</b><small>${products.length} pieces</small></button>` +
		collections
			.map((c) => `<button class="tile" type="button" data-c="${esc(c.handle)}" aria-pressed="${state.c === c.handle}"><b>${esc(c.title)}</b><small>${c.count} piece${c.count === 1 ? "" : "s"}</small></button>`)
			.join("");

	const inCollection = products.filter((p) => !state.c || p.collection === state.c);
	types.innerHTML =
		`<button class="chip" type="button" data-t="" aria-pressed="${!state.t}">All <small>${inCollection.length}</small></button>` +
		TYPES.map((t) => {
			const n = inCollection.filter((p) => p.type === t).length;
			return n ? `<button class="chip" type="button" data-t="${t}" aria-pressed="${state.t === t}">${t}s <small>${n}</small></button>` : "";
		}).join("");

	const q = state.q.trim().toLowerCase();
	let list = inCollection.filter((p) => (!state.t || p.type === state.t) && (!q || p.title.toLowerCase().includes(q)));
	const byOrder = (a, b) => products.indexOf(a) - products.indexOf(b);
	const colours = (p) => colourOption(p)?.values.length || 0;
	const sorters = {
		featured: byOrder,
		low: (a, b) => lowestPrice(a) - lowestPrice(b) || byOrder(a, b),
		high: (a, b) => lowestPrice(b) - lowestPrice(a) || byOrder(a, b),
		colours: (a, b) => colours(b) - colours(a) || byOrder(a, b),
		az: (a, b) => a.title.localeCompare(b.title),
	};
	list = [...list].sort(sorters[state.sort] || byOrder);

	count.textContent = `${list.length} piece${list.length === 1 ? "" : "s"}${q ? ` matching “${state.q.trim()}”` : ""}`;
	grid.innerHTML = list.length
		? list.map(productCard).join("")
		: `<div class="empty"><p>Nothing matches that. Try another type or clear the search.</p><button type="button" class="btn btn--ghost" data-clear>Show everything</button></div>`;
	syncUrl();
}

document.addEventListener("click", (e) => {
	const c = e.target.closest("[data-c]");
	const t = e.target.closest("[data-t]");
	if (c) {
		state.c = c.dataset.c;
		state.t = "";
	} else if (t) state.t = t.dataset.t;
	else if (e.target.closest("[data-clear]")) {
		Object.assign(state, { c: "", t: "", q: "" });
		search.value = "";
	} else return;
	render();
});
let typing;
search.addEventListener("input", () => {
	clearTimeout(typing);
	typing = setTimeout(() => {
		state.q = search.value;
		render();
	}, 150);
});
sort.addEventListener("change", () => {
	state.sort = sort.value;
	render();
});

getCatalog()
	.then((data) => {
		catalog = data;
		render();
	})
	.catch(() => loadError(grid, "products"));
