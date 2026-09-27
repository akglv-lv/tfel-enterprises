"""Checks the site before it ships. No installs needed, just Python 3.

    python scripts/check-site.py            # full report, exit code 1 if anything must be fixed
    python scripts/check-site.py --brand    # only the wording and colour checks

ERRORS block shipping:
  - broken JSON
  - links, scripts or images that point at files that don't exist
  - lead collections that don't exist
  - banned hype words
  - colours outside the brand palette
WARNINGS are a to-do list:
  - placeholder text still waiting on Tyler
  - coaching prices not set
  - an old video list
  - sold-out items
Rules live in brand/brand.json.
"""

import argparse
import glob
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

errors = []
warnings = []
info = []


def rel(p):
	return Path(p).resolve().relative_to(ROOT).as_posix()


def load_json(path, required=True):
	try:
		return json.loads(Path(path).read_text(encoding="utf-8"))
	except FileNotFoundError:
		if required:
			errors.append(f"{rel(path)}: missing")
	except json.JSONDecodeError as e:
		errors.append(f"{rel(path)}:{e.lineno}: broken JSON ({e.msg})")
	return None


def authored_files(brand):
	files = []
	for pattern in brand["authored_files"]:
		files += glob.glob(str(ROOT / pattern))
	return sorted(set(files))


def check_json():
	for f in sorted(SITE.glob("data/*.json")):
		load_json(f)
	load_json(ROOT / "brand" / "brand.json")


def check_references():
	"""Every local href/src in the pages, every JS import and every fetch() must point at a real file."""
	for page in sorted(SITE.glob("*.html")):
		text = page.read_text(encoding="utf-8")
		for m in re.finditer(r'(?:href|src)="([^"]+)"', text):
			url = m.group(1)
			if re.match(r"^(https?:|mailto:|tel:|#|data:|javascript:)", url) or "${" in url or "'" in url or "+" in url:
				continue
			path = url.split("#")[0].split("?")[0]
			if not path:
				continue
			target = SITE / path.lstrip("/") if path.startswith("/") else page.parent / path
			if not target.exists():
				line = text[: m.start()].count("\n") + 1
				errors.append(f"{rel(page)}:{line}: links to missing file {url}")
	for js in sorted(SITE.glob("js/**/*.js")) + sorted(SITE.glob("*.html")):
		text = js.read_text(encoding="utf-8")
		for m in re.finditer(r'(?:import\s+(?:[^"\']+\s+from\s+)?|import\()["\'](\.{1,2}/[^"\']+)["\']', text):
			if not (js.parent / m.group(1)).resolve().exists():
				line = text[: m.start()].count("\n") + 1
				errors.append(f"{rel(js)}:{line}: imports missing file {m.group(1)}")
		for m in re.finditer(r'fetch\("([^"$]+)"', text):
			if not m.group(1).startswith("http") and not (SITE / m.group(1)).exists():
				line = text[: m.start()].count("\n") + 1
				errors.append(f"{rel(js)}:{line}: fetches missing file {m.group(1)}")


def check_catalog():
	catalog = load_json(SITE / "data" / "products.json")
	site = load_json(SITE / "data" / "site.json")
	if not catalog or not site:
		return
	handles = {c["handle"] for c in catalog["collections"]}
	products = catalog["products"]
	for key in ("featured", "second"):
		h = (site.get(key) or {}).get("collection")
		if h and h not in handles:
			errors.append(f"site/data/site.json: {key} collection '{h}' isn't in products.json (have: {', '.join(sorted(handles))})")
	for h in site.get("more", []):
		if h not in handles:
			errors.append(f"site/data/site.json: 'more' lists unknown collection '{h}'")
	no_img = [p["title"] for p in products if not p["images"]]
	if no_img:
		warnings.append(f"{len(no_img)} product(s) have no photo: {', '.join(no_img)}")
	sold = sum(1 for p in products for v in p["variants"] if not v["available"])
	info.append(
		f"Catalogue: {len(products)} products, {sum(len(p['variants']) for p in products)} variants, {sold} sold out; "
		f"featured = {site['featured']['collection']}, second = {(site.get('second') or {}).get('collection')}"
	)


def check_brand(brand):
	phrases = brand["banned_phrases"]
	pattern = re.compile(r"(?<![\w-])(" + "|".join(re.escape(p) for p in phrases) + r")(?![\w-])", re.IGNORECASE)
	palette = {c.lower() for c in brand["palette"]}
	exempt = {str((ROOT / f).resolve()) for f in brand["colour_exempt_files"]}
	hex_re = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b")
	for f in authored_files(brand):
		lines = Path(f).read_text(encoding="utf-8").splitlines()
		for n, line in enumerate(lines, 1):
			# Code comments explain things to developers; only visible wording and styles count.
			if line.strip().startswith(("//", "/*", "*", "<!--")):
				continue
			for m in pattern.finditer(line):
				errors.append(f'{rel(f)}:{n}: hype word "{m.group(1)}". Say it plainly (brand/BRAND.md)')
			if str(Path(f).resolve()) in exempt:
				continue
			for m in hex_re.finditer(line):
				# Skip things like "#main" anchors and "#1001" order numbers: only real colour contexts.
				before = line[: m.start()]
				if not re.search(r"(:|,|\(|=\s*\"|color|background|fill|stroke)\s*$", before.rstrip()) and "style" not in line and "--" not in line:
					continue
				if m.group(0).lower() not in palette:
					errors.append(f"{rel(f)}:{n}: colour {m.group(0)} isn't in the brand palette (brand/brand.json)")
		text = "\n".join(lines)
		if re.search(r"linear-gradient|radial-gradient", text) and f.endswith(".css"):
			for n, line in enumerate(lines, 1):
				if "gradient" in line and not line.strip().startswith(("/*", "*")):
					errors.append(f"{rel(f)}:{n}: gradient. The brand is flat black and white")


def check_placeholders(brand):
	count = 0
	for f in authored_files(brand):
		for n, line in enumerate(Path(f).read_text(encoding="utf-8").splitlines(), 1):
			if 'class="placeholder-note"' in line:
				count += 1
				label = re.sub(r"<[^>]+>", "", line).strip()
				warnings.append(f"{rel(f)}:{n}: waiting on Tyler: {label}")
	coaching = load_json(SITE / "data" / "coaching.json") or {}
	unpriced = [p["name"] for p in coaching.get("packages", []) if p.get("price") is None]
	if unpriced:
		warnings.append(f"Coaching prices not set: {', '.join(unpriced)} (site/data/coaching.json)")
	status = coaching.get("availability", {}).get("status")
	info.append(f"Coaching availability: {status}, {len(coaching.get('availability', {}).get('slots', []))} open time(s) listed")


def check_videos(brand):
	v = load_json(SITE / "data" / "videos.json", required=False)
	if not v:
		warnings.append("No site/data/videos.json yet. Run: python scripts/felo.py refresh")
		return
	try:
		age = (datetime.now(timezone.utc) - datetime.fromisoformat(v["synced_at"])).days
	except (KeyError, ValueError):
		age = None
	if age is not None and age > brand.get("videos_stale_after_days", 14):
		warnings.append(f"Video list is {age} days old. Run: python scripts/felo.py refresh")
	info.append(f"Videos: {len(v.get('videos', []))} (synced {v.get('synced_at', 'unknown')})")


def main():
	ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	ap.add_argument("--brand", action="store_true", help="only run the wording and colour checks")
	args = ap.parse_args()

	brand = load_json(ROOT / "brand" / "brand.json")
	if not brand:
		print("\n".join(errors))
		return 1
	if args.brand:
		check_brand(brand)
		check_placeholders(brand)
	else:
		check_json()
		check_references()
		check_catalog()
		check_brand(brand)
		check_placeholders(brand)
		check_videos(brand)

	for line in info:
		print(f"  {line}")
	if warnings:
		print(f"\nWARNINGS ({len(warnings)})")
		for w in warnings:
			print(f"  - {w}")
	if errors:
		print(f"\nERRORS ({len(errors)}): fix these before shipping")
		for e in errors:
			print(f"  x {e}")
		return 1
	print("\nOK: no errors.")
	return 0


if __name__ == "__main__":
	sys.exit(main())
