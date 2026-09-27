import "../layout.js";
import { wireForm } from "../forms.js";
import { money } from "../store.js";
import { esc } from "../ui.js";

// Fill the time zone from the visitor's device; they can still change it.
const zone = document.querySelector("[data-timezone]");
try {
	zone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
} catch {
	// Old browsers: the field just stays empty.
}

wireForm(document.querySelector("[data-apply-form]"), "coaching-application");

fetch("data/coaching.json")
	.then((r) => r.json())
	.then((data) => {
		document.querySelector("[data-skills]").innerHTML = data.skills
			.map((s) => `<div class="skill"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
			.join("");

		document.querySelector("[data-packages]").innerHTML = data.packages
			.map(
				(p) => `
				<article class="package${p.featured ? " package--pick" : ""}">
					${p.featured ? `<span class="package__flag">Most popular</span>` : ""}
					<h3>${esc(p.name)}</h3>
					<p class="meta" style="margin: 0">${esc(p.summary)}</p>
					<div class="package__price">${p.price == null ? "TBA" : money(p.price)} <small>${esc(p.unit)}</small></div>
					<ul>${p.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
					<a class="btn${p.featured ? "" : " btn--ghost"}" href="#apply" data-pick="${esc(p.id)}">Apply for ${esc(p.name)}</a>
				</article>`,
			)
			.join("");
		document.querySelector("[data-price-note]").hidden = !data.packages.some((p) => p.price == null);

		const select = document.querySelector("[data-package-select]");
		select.insertAdjacentHTML(
			"beforeend",
			data.packages.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}${p.price == null ? "" : ` (${money(p.price)})`}</option>`).join("") +
				`<option value="not-sure">Not sure yet</option>`,
		);

		document.querySelector("[data-steps]").innerHTML = data.steps
			.map((s) => `<li><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`)
			.join("");

		document.querySelector("[data-games]").innerHTML = data.games.map((g) => `<option value="${esc(g)}">`).join("");

		document.querySelector("[data-faq]").innerHTML = data.faq
			.map((f) => `<details class="fold"><summary>${esc(f.q)}</summary><div class="rte"><p>${esc(f.a)}</p></div></details>`)
			.join("");

		// "Apply for X" buttons pre-select that package in the form.
		document.addEventListener("click", (e) => {
			const pick = e.target.closest("[data-pick]");
			if (pick) select.value = pick.dataset.pick;
		});
	})
	.catch(() => {
		document.querySelector("[data-packages]").innerHTML = `<p class="empty">Couldn't load packages. Refresh the page to try again.</p>`;
	});
