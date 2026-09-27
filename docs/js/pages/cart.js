import "../layout.js";
import { SETTINGS, cartDetails, checkout, money, removeLine, setQty, shortTitle, sized } from "../store.js";
import { esc, loadError } from "../ui.js";

const root = document.querySelector("[data-cart]");

async function render() {
	let details;
	try {
		details = await cartDetails();
	} catch {
		return loadError(root, "your cart");
	}
	const { lines, subtotal } = details;

	if (!lines.length) {
		root.innerHTML = `
			<div class="empty">
				<p>Your cart is empty.</p>
				<a class="btn" href="shop.html">Shop everything</a>
			</div>`;
		return;
	}

	let shipping = "";
	const over = SETTINGS.freeShippingOver;
	if (over) {
		const left = over - subtotal;
		const pct = Math.min(100, (subtotal / over) * 100);
		shipping = `
			<div class="ship">
				<p>${left > 0 ? `Add ${money(left)} more for free shipping.` : "You've got free shipping."}</p>
				<div class="ship__bar"><span style="width: ${pct}%"></span></div>
			</div>`;
	}

	root.innerHTML = `
		<div class="cart__grid">
			<div class="cart__lines">
				${lines
					.map((l) => {
						const url = `product.html?p=${encodeURIComponent(l.handle)}&v=${l.variantId}`;
						const variantName = l.variant.title === "Default Title" ? "" : `<span class="meta">${esc(l.variant.title)}</span>`;
						return `
							<div class="line">
								<a class="line__pic" href="${url}">${l.image ? `<img src="${sized(l.image, 240)}" alt="" loading="lazy">` : ""}</a>
								<div class="line__info">
									<a class="line__title" href="${url}">${esc(shortTitle(l.product.title))}</a>
									${variantName}
									<span class="meta">${money(l.variant.price)} each</span>
									${l.variant.available ? "" : `<span class="field__error">This option just sold out. Remove it to check out.</span>`}
									<button type="button" class="line__remove" data-remove="${l.variantId}">Remove</button>
								</div>
								<div class="line__right">
									<div class="qty">
										<label class="visually-hidden" for="q-${l.variantId}">Quantity for ${esc(l.product.title)}</label>
										<button type="button" data-qty="-1" aria-label="One fewer">−</button>
										<input id="q-${l.variantId}" type="number" min="0" max="99" value="${l.qty}" inputmode="numeric" data-line="${l.variantId}">
										<button type="button" data-qty="1" aria-label="One more">+</button>
									</div>
									<span class="price">${money(l.lineTotal)}</span>
								</div>
							</div>`;
					})
					.join("")}
			</div>
			<aside class="cart__summary" aria-label="Order summary">
				${shipping}
				<div class="sum"><span>Subtotal</span><span class="price">${money(subtotal)}</span></div>
				<p class="meta">Taxes and shipping are worked out at checkout.</p>
				<button type="button" class="btn btn--wide" data-checkout>Check out</button>
				<p class="notice" data-checkout-note hidden></p>
				<a class="link-arrow" href="shop.html">Keep shopping</a>
			</aside>
		</div>`;
}

root.addEventListener("change", (e) => {
	const input = e.target.closest("[data-line]");
	if (!input) return;
	setQty(input.dataset.line, Math.min(99, Math.max(0, Math.floor(Number(input.value) || 0))));
	render();
});
root.addEventListener("click", async (e) => {
	const remove = e.target.closest("[data-remove]");
	if (remove) {
		removeLine(remove.dataset.remove);
		render();
		return;
	}
	if (e.target.closest("[data-checkout]")) {
		const result = await checkout();
		if (result.ok && result.url) {
			location.href = result.url;
			return;
		}
		const note = root.querySelector("[data-checkout-note]");
		note.textContent = result.message;
		note.hidden = false;
	}
});

render();
