"""Copies FeLo's latest YouTube uploads into site/data/videos.json for the Watch page.

    python scripts/sync-videos.py

YouTube's RSS feed doesn't work for this channel, so this reads the channel's Videos page.
YouTube can change that page at any time. If the format changes and nothing can be read,
the script stops without touching the existing videos.json, so the site keeps its last good list.
(A YouTube Data API key would be the sturdier option later; it needs a Google Cloud project.)
"""

import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CHANNEL_ID = "UCua2C1VPx_NNVGt8cgSqzmA"  # youtube.com/@TylerFeLo
LIMIT = 24
OUT = Path(__file__).resolve().parent.parent / "site" / "data" / "videos.json"


def fetch_page():
	req = urllib.request.Request(
		f"https://www.youtube.com/channel/{CHANNEL_ID}/videos",
		headers={
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
			"Accept-Language": "en-US,en;q=0.9",
			# Skips the EU cookie-consent page, which has no video data on it.
			"Cookie": "CONSENT=YES+1; SOCS=CAI",
		},
	)
	with urllib.request.urlopen(req, timeout=30) as res:
		return res.read().decode("utf-8")


def parse(html):
	m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
	if not m:
		return []
	data = json.loads(m.group(1))
	videos = []

	def walk(node):
		if isinstance(node, dict):
			if "lockupViewModel" in node:
				lock = node["lockupViewModel"]
				meta = lock.get("metadata", {}).get("lockupMetadataViewModel", {})
				rows = meta.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
				parts = [p.get("text", {}).get("content") for r in rows for p in r.get("metadataParts", [])]
				length = None
				for overlay in lock.get("contentImage", {}).get("thumbnailViewModel", {}).get("overlays", []):
					for badge in overlay.get("thumbnailBottomOverlayViewModel", {}).get("badges", []):
						length = badge.get("thumbnailBadgeViewModel", {}).get("text") or length
				vid = lock.get("contentId")
				title = meta.get("title", {}).get("content")
				if vid and title:
					videos.append({"id": vid, "title": title, "length": length, "views": parts[0] if parts else None})
				return
			for v in node.values():
				walk(v)
		elif isinstance(node, list):
			for v in node:
				walk(v)

	walk(data)
	return videos[:LIMIT]


def main():
	try:
		videos = parse(fetch_page())
	except Exception as err:  # network down, YouTube blocked the request, etc.
		print(f"Couldn't read YouTube ({err}). Kept the existing videos.json.")
		return 1
	if not videos:
		print("YouTube's page format changed: no videos found. Kept the existing videos.json.")
		return 1
	payload = {
		"channel": f"https://www.youtube.com/channel/{CHANNEL_ID}",
		"synced_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
		"videos": videos,
	}
	OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
	print(f"Wrote {len(videos)} videos to {OUT}")
	return 0


if __name__ == "__main__":
	sys.exit(main())
