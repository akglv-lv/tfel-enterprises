// Draws the city skyline behind the home page hero.
// The buildings are generated from a fixed seed so every visitor sees the same city,
// and only the sky and window colours change when someone picks a colourway.
(() => {
	const hero = document.querySelector("[data-skyline]");
	if (!hero) return;
	const canvas = hero.querySelector("canvas");
	const ctx = canvas.getContext("2d");
	const buttons = [...hero.querySelectorAll("[data-way]")];
	const nameEl = hero.querySelector("[data-way-name]");
	const linkEl = hero.querySelector("[data-way-link]");
	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

	const first = buttons[0];
	let current = { a: first ? first.dataset.a : "#7B3FE4", b: first ? first.dataset.b : "#FF5FA2" };
	let city = [];

	const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const mix = (a, b, k) => {
		const A = hex(a);
		const B = hex(b);
		return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
	};

	function buildCity(width) {
		const r = seeded(7);
		city = [];
		for (let layer = 0; layer < 3; layer++) {
			let x = -20;
			while (x < width + 20) {
				const w = 26 + r() * 70 * (layer ? 1 : 0.8);
				const h = 0.18 + r() * (0.28 + layer * 0.12);
				const windows = [];
				for (let wy = 10; wy < h * 1000; wy += 16) {
					for (let wx = 6; wx < w - 8; wx += 11) if (r() < 0.32) windows.push([wx, wy, r()]);
				}
				city.push({ layer, x, w, h, antenna: r() < 0.15, windows });
				x += w + r() * 6;
			}
		}
	}

	function paint() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const W = canvas.clientWidth;
		const H = canvas.clientHeight;
		if (canvas.width !== Math.round(W * dpr)) {
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
			buildCity(W);
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const sky = ctx.createLinearGradient(0, 0, 0, H);
		sky.addColorStop(0, "#0A0B13");
		sky.addColorStop(0.45, current.a);
		sky.addColorStop(1, current.b);
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, W, H);

		// A low sun sitting behind the towers.
		ctx.globalAlpha = 0.55;
		ctx.fillStyle = mix(current.b, "#ffffff", 0.35);
		ctx.beginPath();
		ctx.arc(W * 0.72, H * 0.66, Math.min(W, H) * 0.18, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;

		const shades = [mix("#0A0B13", current.a, 0.45), mix("#0A0B13", current.a, 0.22), "#0A0B13"];
		for (const b of city) {
			const bh = b.h * H * (0.9 + b.layer * 0.25);
			const y = H - bh;
			ctx.fillStyle = shades[b.layer];
			ctx.fillRect(b.x, y, b.w, bh);
			if (b.antenna) ctx.fillRect(b.x + b.w / 2 - 1, y - 18, 2, 18);
			if (b.layer === 2) {
				for (const [wx, wy, k] of b.windows) {
					if (wy > bh - 8) continue;
					ctx.globalAlpha = 0.35 + k * 0.5;
					ctx.fillStyle = k < 0.5 ? current.b : mix(current.b, "#ffffff", 0.5);
					ctx.fillRect(b.x + wx, y + wy, 5, 7);
				}
				ctx.globalAlpha = 1;
			}
		}
	}

	function fadeTo(target) {
		if (reduceMotion) {
			current = { ...target };
			paint();
			return;
		}
		const from = { ...current };
		const start = performance.now();
		const step = (now) => {
			const k = Math.min(1, (now - start) / 700);
			const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
			current = { a: mix(from.a, target.a, e), b: mix(from.b, target.b, e) };
			paint();
			if (k < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	function select(button) {
		buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
		if (nameEl) nameEl.textContent = "in " + button.dataset.name;
		if (linkEl && button.dataset.link) linkEl.href = button.dataset.link;
		fadeTo({ a: button.dataset.a, b: button.dataset.b });
	}

	buttons.forEach((b) => b.addEventListener("click", () => select(b)));

	let resizeTimer;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			canvas.width = 0;
			paint();
		}, 100);
	});

	paint();
})();
