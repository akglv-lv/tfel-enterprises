// Small bits of behaviour for the whole store. Everything here is an upgrade:
// with JavaScript off, forms still submit normally and the store keeps working.
(() => {
	const toastEl = document.getElementById("toast");
	let toastTimer;
	function toast(html) {
		if (!toastEl) return;
		toastEl.innerHTML = html;
		toastEl.hidden = false;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toastEl.hidden = true), 3200);
	}
	const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

	// Dropdowns that change the page (sort order, country, cart quantity) submit their form on change.
	document.addEventListener("change", (e) => {
		if (e.target.matches("[data-autosubmit]")) e.target.form.submit();
	});

	// Plus and minus buttons next to any quantity box.
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-qty]");
		if (!btn) return;
		const input = btn.parentElement.querySelector("input[type=number]");
		const min = Number(input.min || 0);
		input.value = Math.max(min, Number(input.value || 0) + Number(btn.dataset.qty));
		input.dispatchEvent(new Event("change", { bubbles: true }));
	});

	// Only one header dropdown open at a time, and clicking elsewhere closes them.
	document.addEventListener("click", (e) => {
		document.querySelectorAll("details.drop[open]").forEach((d) => {
			if (!d.contains(e.target)) d.removeAttribute("open");
		});
	});

	// Product page: pick colour and size, find the matching variant, update price, image and button.
	document.querySelectorAll("[data-product]").forEach((root) => {
		const data = JSON.parse(root.querySelector("[data-product-json]").textContent);
		const form = root.querySelector("form[action*='/cart/add']");
		const idInput = root.querySelector("[data-variant-id]");
		const priceEl = root.querySelector("[data-price]");
		const compareEl = root.querySelector("[data-compare]");
		const addBtn = root.querySelector("[data-add-button]");
		const mainImg = root.querySelector(".product__img");
		const fieldsets = [...root.querySelectorAll("fieldset.option")];
		const money = (cents) =>
			new Intl.NumberFormat(document.documentElement.lang || "en", { style: "currency", currency: window.Shopify?.currency?.active || "USD" }).format(cents / 100);

		const selected = () => fieldsets.map((f) => f.querySelector("input:checked")?.value);
		const findVariant = (opts) => data.variants.find((v) => v.options.every((o, i) => o === opts[i]));

		function showImage(src, mediaId) {
			if (!mainImg || !src) return;
			mainImg.removeAttribute("srcset");
			mainImg.src = src;
			root.querySelectorAll("[data-thumb]").forEach((t) => t.classList.toggle("is-active", t.dataset.mediaId === String(mediaId)));
		}

		// Strike through sizes that don't exist or are sold out in the chosen colour.
		function markUnavailable() {
			const opts = selected();
			fieldsets.forEach((f, index) => {
				f.querySelectorAll("input").forEach((input) => {
					const test = [...opts];
					test[index] = input.value;
					const v = findVariant(test);
					const label = input.nextElementSibling;
					if (label) label.classList.toggle("is-unavailable", !v || !v.available);
				});
			});
		}

		function update() {
			const opts = selected();
			fieldsets.forEach((f, i) => {
				const out = f.querySelector("[data-option-value]");
				if (out) out.textContent = opts[i];
			});
			const v = findVariant(opts);
			markUnavailable();
			if (!v) {
				addBtn.disabled = true;
				addBtn.textContent = "Not available";
				return;
			}
			idInput.value = v.id;
			priceEl.textContent = money(v.price);
			if (compareEl) {
				compareEl.hidden = !(v.compare_at_price > v.price);
				compareEl.textContent = v.compare_at_price ? money(v.compare_at_price) : "";
			}
			addBtn.disabled = !v.available;
			addBtn.textContent = v.available ? "Add to cart" : "Sold out";
			if (v.featured_media) {
				const src = new URL(v.featured_media.preview_image.src, location.href);
				src.searchParams.set("width", "1400");
				showImage(src.toString(), v.featured_media.id);
			}
			const url = new URL(location.href);
			url.searchParams.set("variant", v.id);
			history.replaceState({}, "", url);
		}

		fieldsets.forEach((f) => f.addEventListener("change", update));
		markUnavailable();

		root.querySelectorAll("[data-thumb]").forEach((t) => t.addEventListener("click", () => showImage(t.dataset.src, t.dataset.mediaId)));

		// Add to cart without leaving the page. If anything goes wrong, fall back to a normal form post.
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			addBtn.disabled = true;
			try {
				const res = await fetch(window.theme.cartAddUrl + ".js", {
					method: "POST",
					headers: { Accept: "application/json" },
					body: new FormData(form),
				});
				const item = await res.json();
				if (!res.ok) {
					toast(escapeHtml(item.description || "Couldn't add that. Try another size."));
					return;
				}
				const cart = await fetch(window.theme.cartUrl + ".js").then((r) => r.json());
				document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cart.item_count));
				toast(`Added ${escapeHtml(item.product_title.replace("TFeL Enterprises ", ""))}. <a href="${window.theme.cartUrl}">View cart</a>`);
			} catch (err) {
				form.submit();
			} finally {
				const v = findVariant(selected()) || data.variants[0];
				addBtn.disabled = !v.available;
			}
		});
	});

	// "You might also like": Shopify only returns recommendations through this URL.
	document.querySelectorAll("[data-recommendations]").forEach(async (el) => {
		try {
			const html = await fetch(el.dataset.url).then((r) => r.text());
			const doc = new DOMParser().parseFromString(html, "text/html");
			const fresh = doc.querySelector("[data-recommendations]");
			if (fresh && fresh.innerHTML.trim()) el.innerHTML = fresh.innerHTML;
		} catch (err) {
			// No recommendations is fine; the section just stays empty.
		}
	});
})();
