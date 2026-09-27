"""One command for looking after the FeLo site. Needs only Python 3 and git.

    python scripts/felo.py serve                 preview at http://localhost:5173 (no caching, so edits show on refresh)
    python scripts/felo.py refresh               pull the latest products from tfelent.com and videos from YouTube
    python scripts/felo.py check                 full check (errors block shipping, warnings are a to-do list)
    python scripts/felo.py brand                 only the wording and colour checks
    python scripts/felo.py feature --list        show collections and which ones lead the home page
    python scripts/felo.py feature <handle> [--title T] [--line L] [--second <handle>]
    python scripts/felo.py ship -m "message"     refresh, check, then commit (and push if a remote is set up)
    python scripts/felo.py ship                  same, but stops before committing and shows what would change
"""

import argparse
import functools
import http.server
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "docs"
SCRIPTS = ROOT / "scripts"
PY = sys.executable
# What "ship" commits. theme/ (the Shopify backup) is left out on purpose.
SHIP_PATHS = [p for p in ["docs", "scripts", "brand", ".claude", ".github", "README.md"] if (ROOT / p).exists()]


def run(*args, check=False):
	print(f"\n> {' '.join(str(a) for a in args)}")
	result = subprocess.run([str(a) for a in args], cwd=ROOT)
	if check and result.returncode != 0:
		sys.exit(result.returncode)
	return result.returncode


def git(*args, capture=False):
	r = subprocess.run(["git", *args], cwd=ROOT, capture_output=capture, text=True)
	return r.stdout.strip() if capture else r.returncode


# ---------- serve ----------
class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
	def end_headers(self):
		self.send_header("Cache-Control", "no-store")
		super().end_headers()

	def send_error(self, code, message=None, explain=None):
		# Show the site's own 404 page, the way a real host would.
		if code == 404 and (SITE / "404.html").exists():
			body = (SITE / "404.html").read_bytes()
			self.send_response(404)
			self.send_header("Content-Type", "text/html; charset=utf-8")
			self.send_header("Content-Length", str(len(body)))
			self.end_headers()
			self.wfile.write(body)
			return
		super().send_error(code, message, explain)


def cmd_serve(args):
	handler = functools.partial(NoCacheHandler, directory=str(SITE))
	with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as httpd:
		print(f"Serving docs/ at http://localhost:{args.port}  (Ctrl+C to stop)")
		try:
			httpd.serve_forever()
		except KeyboardInterrupt:
			pass


# ---------- refresh / check ----------
def cmd_refresh(_args):
	products = run(PY, SCRIPTS / "sync-products.py")
	videos = run(PY, SCRIPTS / "sync-videos.py")
	if products != 0:
		print("\nProducts didn't refresh. The site keeps the last good copy.")
	if videos != 0:
		print("\nVideos didn't refresh. The site keeps the last good copy.")
	return products


def cmd_check(_args):
	return run(PY, SCRIPTS / "check-site.py")


def cmd_brand(_args):
	return run(PY, SCRIPTS / "check-site.py", "--brand")


# ---------- feature ----------
def cmd_feature(args):
	catalog = json.loads((SITE / "data" / "products.json").read_text(encoding="utf-8"))
	site_path = SITE / "data" / "site.json"
	site = json.loads(site_path.read_text(encoding="utf-8"))
	cols = {c["handle"]: c for c in catalog["collections"]}

	if args.list or not args.handle:
		print("Collections (handle: title, pieces):")
		for h, c in cols.items():
			tag = " <- featured" if h == site["featured"]["collection"] else " <- second" if h == (site.get("second") or {}).get("collection") else ""
			print(f"  {h}: {c['title']}, {c['count']}{tag}")
		return 0

	for h in filter(None, [args.handle, args.second]):
		if h not in cols:
			print(f"Unknown collection '{h}'. Run: python scripts/felo.py feature --list")
			return 1
	if args.second == args.handle:
		print("The featured and second collections must be different.")
		return 1

	old = site["featured"]
	if old["collection"] != args.handle:
		# The old lead drops to second place (unless --second names another collection below).
		site["second"] = old
		site["featured"] = {"collection": args.handle, "title": cols[args.handle]["title"], "line": ""}
	if args.title:
		site["featured"]["title"] = args.title
	if args.line is not None:
		site["featured"]["line"] = args.line
	if args.second:
		site["second"] = {"collection": args.second, "title": cols[args.second]["title"], "line": ""}
	lead = {site["featured"]["collection"], (site.get("second") or {}).get("collection")}
	site["more"] = [h for h in cols if h not in lead]

	site_path.write_text(json.dumps(site, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")
	print(f"Featured: {site['featured']['title']} ({site['featured']['collection']})")
	print(f"Second:   {site['second']['title']} ({site['second']['collection']})")
	print(f"More:     {', '.join(site['more'])}")
	if not site["featured"].get("line"):
		print('Tip: add a one-line description with --line "..." (plain words, see brand/BRAND.md)')
	return 0


# ---------- ship ----------
def cmd_ship(args):
	if not args.no_refresh:
		cmd_refresh(args)
	if run(PY, SCRIPTS / "check-site.py") != 0:
		print("\nNot shipping: fix the errors above first.")
		return 1

	changes = git("status", "--short", "--", *SHIP_PATHS, capture=True)
	if not changes:
		print("\nNothing changed. Nothing to ship.")
		return 0
	print("\nChanges:\n" + changes)
	if not args.message:
		print('\nChecks passed. To commit these, run again with -m "what changed and why".')
		return 0

	git("add", "--", *SHIP_PATHS)
	if git("commit", "-m", args.message) != 0:
		return 1
	if not git("remote", capture=True):
		print("\nCommitted. No git remote is set up yet, so nothing was pushed.")
		return 0
	if git("push") != 0:
		return 1
	# GitHub Pages publishes docs/ from main on every push.
	print("Pushed. Live at https://akglv-lv.github.io/tfel-enterprises/ in about a minute.")
	return 0


def main():
	ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	sub = ap.add_subparsers(dest="cmd", required=True)
	s = sub.add_parser("serve", help="preview the site locally")
	s.add_argument("--port", type=int, default=5173)
	sub.add_parser("refresh", help="pull products and videos")
	sub.add_parser("check", help="run every check")
	sub.add_parser("brand", help="wording and colour checks only")
	f = sub.add_parser("feature", help="choose which collection leads the home page")
	f.add_argument("handle", nargs="?")
	f.add_argument("--second")
	f.add_argument("--title")
	f.add_argument("--line")
	f.add_argument("--list", action="store_true")
	sh = sub.add_parser("ship", help="refresh, check and commit")
	sh.add_argument("-m", "--message")
	sh.add_argument("--no-refresh", action="store_true")
	args = ap.parse_args()
	handlers = {"serve": cmd_serve, "refresh": cmd_refresh, "check": cmd_check, "brand": cmd_brand, "feature": cmd_feature, "ship": cmd_ship}
	sys.exit(handlers[args.cmd](args) or 0)


if __name__ == "__main__":
	main()
