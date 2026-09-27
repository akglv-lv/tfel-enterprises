// Discord: stays hidden until docs/data/site.json has discord.serverId.
// With an ID, the Watch page shows Discord's official server widget (who's online + join button),
// and the home page gets a "Discord" button next to the other socials.
import { getSite } from "./store.js";

const ICON =
	'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.7.1 18.2a20 20 0 0 0 6 3l1.3-2.1a13 13 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.9 19.9 0 0 0 6-3c.5-5.2-.8-9.8-3.6-13.8ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>';

async function inviteFor(id, fallback) {
	if (fallback) return fallback;
	// The widget's public JSON includes a working invite link when the widget is enabled.
	try {
		const r = await fetch(`https://discord.com/api/guilds/${id}/widget.json`);
		if (r.ok) return (await r.json()).instant_invite || null;
	} catch {
		// Blocked or offline: the button just isn't shown.
	}
	return null;
}

getSite().then(async (site) => {
	const d = site.discord || {};
	const id = String(d.serverId || "").trim();
	if (!/^\d{15,22}$/.test(id)) return;
	const invite = await inviteFor(id, d.invite);

	const section = document.querySelector("[data-discord]");
	if (section) {
		section.querySelector("[data-discord-widget]").src = `https://discord.com/widget?id=${id}&theme=light`;
		const join = section.querySelector("[data-discord-join]");
		if (invite) join.href = invite;
		else join.hidden = true;
		section.hidden = false;
	}

	const socials = document.querySelector("[data-socials-home]");
	if (socials && invite) {
		// Wait for home.js to draw the other buttons, then add Discord at the end.
		const add = () =>
			socials.insertAdjacentHTML("beforeend", `<a class="social-btn" href="${invite}" target="_blank" rel="noopener" aria-label="FeLo's Discord">${ICON}<span>Discord</span></a>`);
		socials.children.length ? add() : new MutationObserver((_, obs) => (obs.disconnect(), add())).observe(socials, { childList: true });
	}
});
