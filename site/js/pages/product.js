import "../layout.js";
import { addToCart, findVariantById, getCatalog, money, optionIndex, shortTitle, sized } from "../store.js";
import { swatchColour } from "../swatches.js";
import { esc, loadError, productCard, toast } from "../ui.js";

const root = document.querySelector("[data-product]");
const params = new URLSearchParams(location.search);

getCatalog()
	.then(({ collections, products }) => {
		const product = products.find((p) => p.handle === params.get("p"));
		if (!product) return notFound();
		render(product, collections.find((c) => c.handle === product.collection));
		related(product, products);
	})
	.catch(() => loadError(root, "this product"));

function notFound() {
	document.title = "Not found | FeLo";
	root.innerHTML = `
		<div class="notfound">
			<p class="eyebrow">Not found</p>
			<h1 class="page-title">We couldn't find that piece</h1>
			<p>It may have been renamed or retired. Everything that's still for sale is in the shop.</p>
			<a class="btn" href="shop.html">Shop everything</a>
		</div>`;
}

function render(product, collection) {
	const colourIdx = Math.max(optionIndex(product, "color"), optionIndex(product, "colour"));
	const single = product.variants.length === 1 && product.variants[0].title === "Default Title";
	const start =
		findVariantById(product, params.get("v")) || product.variants.find((v) => v.available) || product.variants[0];
	let selected = [...start.options];
	const name = shortTitle(product.title);
	document.title = `${name} | FeLo`;

	const optionsHtml = single
		? ""
		: product.options
				.map((opt, i) => {
					const isColour = i === colourIdx;
					const values = opt.values
						.map((val, j) => {
							const id = `opt-${i}-${j}`;
							const label = isColour
								? `<label for="${id}" class="swatch" title="${esc(val)}"><i style="background: ${swatchColour(val)}"></i><span class="visually-hidden">${esc(val)}</span></label>`
								: `<label for="${id}" class="pill">${esc(val)}</label>`;
							return `<input type="radio" id="${id}" name="opt-${i}" value="${esc(val)}"${selected[i] === val ? " checked" : ""}>${label}`;
						})
						.join("");
					return `
						<fieldset class="option" data-option="${i}">
							<legend>${esc(opt.name)}: <span data-option-value>${esc(selected[i])}</span></legend>
							<div class="option__values${isColour ? " option__values--swatch" : ""}">${values}</div>
						</fieldset>`;
				})
				.join("");

	root.innerHTML = `
		<div class="product">
			<div class="product__media">
				<div class="product__main"><img data-main alt="${esc(product.title)}" width="1400" height="1400"></div>
				<div class="product__thumbs" data-thumbs></div>
			</div>
			<div class="product__info">
				<nav class="crumbs" aria-label="Breadcrumb">
					<a href="shop.html">Shop</a><span aria-hidden="true">/</span>
					${collection ? `<a href="shop.html?c=${encodeURIComponent(collection.handle)}">${esc(collection.title)}</a><span aria-hidden="true">/</span>` : ""}
					<span>${esc(product.type)}</span>
				</nav>
				<h1 class="product__title">${esc(name)}</h1>
				<p class="product__price"><span data-price></span><s class="product__compare" data-compare hidden></s></p>
				<form class="product__form" data-form>
					${optionsHtml}
					<div class="product__buy">
						<div class="qty">
							<label for="Qty" class="visually-hidden">Quantity</label>
							<button type="button" data-qty="-1" aria-label="One fewer">−</button>
							<input id="Qty" type="number" value="1" min="1" max="99" inputmode="numeric">
							<button type="button" data-qty="1" aria-label="One more">+</button>
						</div>
						<button type="submit" class="btn" data-add>Add to cart</button>
					</div>
				</form>
				${product.description ? `<details class="fold" open><summary>Details</summary><div class="rte">${product.description}</div></details>` : ""}
				<details class="fold"><summary>Shipping and returns</summary><div class="rte"><p>Each piece is printed when you order it. Delivery times and the returns policy are on the <a href="help.html#shipping">Help page</a>.</p></div></details>
				<details class="fold"><summary>Size guide</summary><div class="rte"><p>Available sizes for every product type are in the <a href="help.html#sizes">size guide</a>.</p></div></details>
			</div>
		</div>`;

	const main = root.querySelector("[data-main]");
	const thumbs = root.querySelector("[data-thumbs]");
	const priceEl = root.querySelector("[data-price]");
	const compareEl = root.querySelector("[data-compare]");
	const addBtn = root.querySelector("[data-add]");
	const qtyInput = root.querySelector("#Qty");
	const fieldsets = [...root.querySelectorAll("[data-option]")];

	const findVariant = (opts) => product.variants.find((v) => v.options.every((o, i) => o === opts[i]));

	function showImage(src) {
		main.src = sized(src, 1100);
		main.srcset = `${sized(src, 700)} 700w, ${sized(src, 1100)} 1100w, ${sized(src, 1600)} 1600w`;
		main.sizes = "(min-width: 960px) 55vw, 100vw";
		thumbs.querySelectorAll("[data-src]").forEach((t) => t.classList.toggle("is-active", t.dataset.src === src));
	}

	// Photos for the chosen colour only, so the thumbnails don't mix every colourway together.
	function imagesForColour() {
		if (colourIdx < 0) return product.images;
		const ids = new Set(product.variants.filter((v) => v.options[colourIdx] === selected[colourIdx]).map((v) => v.id));
		const mine = product.images.filter((img) => img.variant_ids.some((id) => ids.has(id)));
		return mine.length ? mine : product.images;
	}

	let shownColour = null;
	function renderThumbs() {
		if (shownColour === selected[colourIdx]) return;
		shownColour = selected[colourIdx];
		const imgs = imagesForColour();
		thumbs.innerHTML =
			imgs.length > 1
				? imgs
						.map(
							(img, i) =>
								`<button type="button" class="thumb" data-src="${esc(img.src)}" aria-label="Photo ${i + 1} of ${imgs.length}"><img src="${sized(img.src, 160)}" alt="" loading="lazy"></button>`,
						)
						.join("")
				: "";
	}

	// Cross out values that don't exist or are sold out alongside the other choices.
	function markUnavailable() {
		fieldsets.forEach((f) => {
			const i = Number(f.dataset.option);
			f.querySelectorAll("input").forEach((input) => {
				const test = [...selected];
				test[i] = input.value;
				const v = findVariant(test);
				input.nextElementSibling.classList.toggle("is-unavailable", !v || !v.available);
			});
		});
	}

	function update() {
		fieldsets.forEach((f) => {
			const i = Number(f.dataset.option);
			selected[i] = f.querySelector("input:checked").value;
			f.querySelector("[data-option-value]").textContent = selected[i];
		});
		const v = findVariant(selected);
		markUnavailable();
		renderThumbs();
		if (!v) {
			addBtn.disabled = true;
			addBtn.textContent = "Not made in this combo";
			return;
		}
		priceEl.textContent = money(v.price);
		const onSale = v.compare_at_price && Number(v.compare_at_price) > Number(v.price);
		compareEl.hidden = !onSale;
		compareEl.textContent = onSale ? money(v.compare_at_price) : "";
		addBtn.disabled = !v.available;
		addBtn.textContent = v.available ? "Add to cart" : "Sold out";
		showImage(v.image || imagesForColour()[0]?.src || product.images[0]?.src);
		const url = new URL(location.href);
		url.searchParams.set("v", v.id);
		history.replaceState(null, "", url);
	}

	root.querySelector("[data-form]").addEventListener("change", (e) => {
		if (e.target.closest("[data-option]")) update();
	});
	thumbs.addEventListener("click", (e) => {
		const t = e.target.closest("[data-src]");
		if (t) showImage(t.dataset.src);
	});
	root.querySelector("[data-form]").addEventListener("submit", (e) => {
		e.preventDefault();
		const v = findVariant(selected);
		if (!v || !v.available) return;
		const qty = Math.min(99, Math.max(1, Number(qtyInput.value) || 1));
		addToCart(product.handle, v.id, qty);
		const detail = single ? "" : ` (${v.title})`;
		toast(`Added ${esc(name)}${esc(detail)}. <a href="cart.html">View cart</a>`);
	});

	update();
	root.querySelector(".product").removeAttribute("aria-busy");
}

function related(product, products) {
	const list = products.filter((p) => p.collection === product.collection && p.handle !== product.handle).slice(0, 4);
	if (!list.length) return;
	document.querySelector("[data-related-grid]").innerHTML = list.map(productCard).join("");
	document.querySelector("[data-related-link]").href = `shop.html?c=${encodeURIComponent(product.collection)}`;
	document.querySelector("[data-related]").hidden = false;
}
