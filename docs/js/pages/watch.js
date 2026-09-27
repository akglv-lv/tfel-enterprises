import "../layout.js";
import { getSite } from "../store.js";
import { esc } from "../ui.js";

const player = document.querySelector("[data-player]");
const chat = document.querySelector("[data-chat]");
const videos = document.querySelector("[data-videos]");

// Twitch only plays inside pages whose domain is listed as "parent".
// Opening the file straight from disk has no domain, so we show a link instead.
function mountTwitch(channel) {
	const host = location.hostname;
	if (!host) {
		player.innerHTML = `<div class="empty" style="color: #aaa; padding: 24px">The stream player needs the site to be served (see README). <a href="https://twitch.tv/${esc(channel)}">Watch on Twitch</a></div>`;
		chat.hidden = true;
		return;
	}
	const c = encodeURIComponent(channel);
	const parent = encodeURIComponent(host);
	player.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${c}&parent=${parent}&muted=true&autoplay=false" title="FeLo live on Twitch" allowfullscreen></iframe>`;
	chat.innerHTML = `<iframe src="https://www.twitch.tv/embed/${c}/chat?parent=${parent}" title="Twitch chat"></iframe>`;
}

// Latest uploads come from data/videos.json (scripts/sync-videos.py). Clicking one plays it right here.
function renderVideos(list) {
	if (!list.length) {
		videos.innerHTML = `<p class="empty">No videos loaded yet. Run scripts/sync-videos.py.</p>`;
		return;
	}
	videos.innerHTML = list
		.slice(0, 12)
		.map(
			(v) => `
			<a class="video video--play" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener" data-video="${esc(v.id)}">
				<div class="video__pic">
					<img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy">
					${v.length ? `<span class="video__len">${esc(v.length)}</span>` : ""}
				</div>
				<h3 class="video__title">${esc(v.title)}</h3>
				${v.views ? `<span class="meta">${esc(v.views)} views</span>` : ""}
			</a>`,
		)
		.join("");
}

videos.addEventListener("click", (e) => {
	const card = e.target.closest("[data-video]");
	if (!card || e.metaKey || e.ctrlKey) return;
	e.preventDefault();
	const pic = card.querySelector(".video__pic");
	card.classList.remove("video--play");
	pic.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(card.dataset.video)}?autoplay=1" title="${esc(card.querySelector(".video__title").textContent)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0"></iframe>`;
});

getSite()
	.then((site) => {
		const ch = site.channels || {};
		if (ch.twitch) {
			mountTwitch(ch.twitch);
			document.querySelector("[data-twitch-link]").href = `https://twitch.tv/${ch.twitch}`;
		}
		if (ch.youtube) document.querySelector("[data-youtube-link]").href = ch.youtube;
		if (ch.tiktok) document.querySelector("[data-tiktok-link]").href = ch.tiktok;
	})
	.catch(() => mountTwitch("FeLo"));

fetch("data/videos.json")
	.then((r) => (r.ok ? r.json() : { videos: [] }))
	.then((d) => renderVideos(d.videos || []))
	.catch(() => renderVideos([]));
