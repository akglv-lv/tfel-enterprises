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

const STATUS_TEXT = { open: "Taking sessions", waitlist: "Waitlist", closed: "Not taking sessions" };

// Open times are stored with their own offset and shown in the visitor's time zone.
function slotLabel(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

fetch("data/coaching.json")
	.then((r) => r.json())
	.then((data) => {
		const a = data.availability || { status: "waitlist" };
		const status = STATUS_TEXT[a.status] ? a.status : "waitlist";
		const upcoming = (a.slots || []).filter((s) => new Date(s) > new Date()).map(slotLabel).filter(Boolean);
		document.querySelector("[data-availability]").innerHTML =
			`<span class="status status--${status}">${STATUS_TEXT[status]}</span>` +
			(upcoming.length ? `<span>${upcoming.length} open time${upcoming.length === 1 ? "" : "s"} coming up</span>` : a.note ? `<span style="color: var(--on-black-grey)">${esc(a.note)}</span>` : "");
		document.querySelector("[data-slots]").innerHTML = upcoming.length
			? `<p class="label">Open times (your time zone)</p><div class="slots">${upcoming.map((s) => `<span class="slot">${esc(s)}</span>`).join("")}</div>`
			: "";

		document.querySelector("[data-skills]").innerHTML = data.skills
			.map((s) => `<div class="skill"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
			.join("");

		document.querySelector("[data-packages]").innerHTML = data.packages
			.map(
				(p) => `
				<article class="package${p.featured ? " package--pick" : ""}">
					${p.featured ? `<span class="package__flag">Start here</span>` : ""}
					<h3>${esc(p.name)}</h3>
					<p class="meta" style="margin: 0">${esc(p.summary)}</p>
					<div class="package__price">${p.price == null ? "Price TBA" : money(p.price)} <small>${p.price == null ? "" : esc(p.unit)}</small></div>
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
		document.querySelector("[data-modes]").insertAdjacentHTML("beforeend", (data.modes || []).map((m) => `<option>${esc(m)}</option>`).join(""));

		document.querySelector("[data-steps]").innerHTML = data.steps
			.map((s) => `<li><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`)
			.join("");

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
