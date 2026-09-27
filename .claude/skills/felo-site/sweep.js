// Page sweep for the FeLo site. Paste into the browser pane's JavaScript tool while
// http://localhost:5173 is open (python scripts/felo.py serve).
// Run it twice: once as-is (desktop) and once with WIDTH = 390 (phone). One run per width keeps
// it under the JavaScript tool's 45-second limit.
// Loads every page in a hidden frame at that width and reports, per page:
// sideways overflow, broken images, missing footer, script errors, and a few page-specific counts.
const WIDTH = 1280;
const pages = [
	"index.html",
	"shop.html",
	"shop.html?c=man-i-love-felo",
	"product.html?p=man-i-love-felo-shirt",
	"product.html?p=tfel-enterprises-premium-hoodie",
	"product.html?p=b2a-hat",
	"product.html?p=not-a-real-product",
	"cart.html",
	"watch.html",
	"coaching.html",
	"about.html",
	"help.html",
	"contact.html?topic=order",
	"404.html",
	"no-such-page",
];
const rows = [];
for (const width of [WIDTH]) {
	for (const p of pages) {
		const f = document.createElement("iframe");
		f.style.cssText = `position:fixed;left:-6000px;top:0;width:${width}px;height:900px`;
		document.body.appendChild(f);
		const errs = [];
		await new Promise((res) => {
			f.onload = res;
			f.src = "/" + p;
		});
		f.contentWindow.addEventListener("error", (e) => errs.push(e.message));
		f.contentWindow.addEventListener("unhandledrejection", (e) => errs.push(String(e.reason)));
		await new Promise((r) => setTimeout(r, 900));
		const d = f.contentDocument;
		const problems = [];
		if (d.documentElement.scrollWidth > width) problems.push(`overflow ${d.documentElement.scrollWidth}px`);
		const broken = [...d.images].filter((i) => i.complete && i.naturalWidth === 0).length;
		if (broken) problems.push(`${broken} broken image(s)`);
		if (!d.querySelector(".site-footer")) problems.push("no footer");
		if (errs.length) problems.push("errors: " + errs.join(" | "));
		const counts = {
			cards: d.querySelectorAll("a.card").length,
			videos: d.querySelectorAll(".video").length,
			twitch: d.querySelectorAll(".watch iframe").length,
		};
		rows.push(`${problems.length ? "✗" : "✓"} ${width} ${p} · "${d.title}" · cards ${counts.cards}${counts.videos ? ` · videos ${counts.videos}` : ""}${counts.twitch ? ` · twitch frames ${counts.twitch}` : ""}${problems.length ? " · " + problems.join(", ") : ""}`);
		f.remove();
	}
}
rows.join("\n");
