"""Copies the live product list from tfelent.com into site/data/products.json.

The site reads that file instead of calling Shopify on every page load, so it works
before any store is connected. Run it again whenever products change:

    python scripts/sync-products.py

Variant ids are kept on purpose: Shopify checkout needs them when we connect it at the end.
"""

import html
import json
import re
import urllib.request
from pathlib import Path

STORE = "https://tfelent.com"
OUT = Path(__file__).resolve().parent.parent / "site" / "data" / "products.json"

# The brand collections shown as tiles on the site. Type collections (shirts, hoodies...)
# are worked out from the product title instead, so they don't need their own list.
BRAND_COLLECTIONS = [
	"tfel-enterprises-skyline",
	"tfel-enterprises-premium",
	"elite-champion",
	"b2a",
	"man-i-love-felo",
]
TYPES = ["Shirt", "Hoodie", "Crewneck", "Hat", "Tank Top"]


def get(path):
	req = urllib.request.Request(STORE + path, headers={"User-Agent": "felo-site-sync/1.0"})
	with urllib.request.urlopen(req, timeout=30) as res:
		return json.load(res)


def clean_description(body):
	# Keep simple formatting from the admin, drop anything that could run code.
	body = re.sub(r"(?is)<(script|style|iframe)[^>]*>.*?</\1>", "", body or "")
	body = re.sub(r"(?i)\son\w+\s*=\s*(\"[^\"]*\"|'[^']*')", "", body)
	return body.strip()


def main():
	collections = {c["handle"]: c for c in get("/collections.json")["collections"]}
	brand = []
	product_collection = {}
	for handle in BRAND_COLLECTIONS:
		if handle not in collections:
			print(f"warning: collection {handle} not found on the store")
			continue
		c = collections[handle]
		items = get(f"/collections/{handle}/products.json?limit=250")["products"]
		for p in items:
			product_collection.setdefault(p["handle"], handle)
		brand.append({"handle": handle, "title": html.unescape(c["title"]), "count": len(items)})

	products = []
	for p in get("/products.json?limit=250")["products"]:
		options = [{"name": o["name"], "values": o["values"]} for o in p["options"]]
		images = [{"src": i["src"], "variant_ids": i["variant_ids"]} for i in p["images"]]
		variants = []
		for v in p["variants"]:
			variants.append(
				{
					"id": v["id"],
					"title": v["title"],
					"options": [x for x in (v["option1"], v["option2"], v["option3"]) if x is not None],
					"price": v["price"],
					"compare_at_price": v["compare_at_price"],
					"available": v["available"],
					"image": (v.get("featured_image") or {}).get("src"),
				}
			)
		title = html.unescape(p["title"])
		products.append(
			{
				"handle": p["handle"],
				"title": title,
				"type": next((t for t in TYPES if title.endswith(t)), "Other"),
				"collection": product_collection.get(p["handle"]),
				"description": clean_description(p["body_html"]),
				"options": options,
				"variants": variants,
				"images": images,
			}
		)

	OUT.parent.mkdir(parents=True, exist_ok=True)
	OUT.write_text(json.dumps({"collections": brand, "products": products}, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
	print(f"Wrote {len(products)} products and {len(brand)} collections to {OUT}")


if __name__ == "__main__":
	main()
