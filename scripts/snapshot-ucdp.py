"""Refresh the public UCDP monthly candidate event snapshot from its download index."""
import csv
import io
import json
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen

INDEX = "https://ucdp.uu.se/downloads/"

class Downloads(HTMLParser):
    def __init__(self):
        super().__init__()
        self.releases = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        href = dict(attrs).get("href", "")
        url = urljoin(INDEX, href)
        parsed = urlparse(url)
        if parsed.hostname != "ucdp.uu.se":
            return
        filename = parsed.path.rsplit("/", 1)[-1]
        if not filename.startswith("GEDEvent_v") or not filename.endswith(".csv"):
            return
        parts = filename.removeprefix("GEDEvent_v").removesuffix(".csv").split("_")
        if len(parts) != 3 or not all(part.isdecimal() for part in parts):
            return
        year, channel, month = map(int, parts)
        if channel != 0 or not 1 <= month <= 12:
            return
        self.releases.append(((year, month), url, f"{year}.0.{month}"))

with urlopen(INDEX, timeout=30) as response:
    index_bytes = response.read(2_000_001)
if len(index_bytes) > 2_000_000:
    raise RuntimeError("UCDP download index exceeds the size limit.")
index_html = index_bytes.decode("utf-8")
parser = Downloads()
parser.feed(index_html)
if not parser.releases:
    raise RuntimeError("No monthly candidate release found in the UCDP download index.")
_, source, version = max(parser.releases)
with urlopen(source, timeout=60) as response:
    data = response.read(15_000_001)
if len(data) > 15_000_000:
    raise RuntimeError("UCDP release exceeds the snapshot size limit.")
rows = list(csv.DictReader(io.StringIO(data.decode("utf-8-sig"))))
columns = ["id", "type_of_violence", "conflict_name", "dyad_name", "where_prec", "where_coordinates", "adm_1", "adm_2", "latitude", "longitude", "country", "date_start", "date_end", "best", "low", "high"]
if not rows or any(column not in rows[0] for column in columns):
    raise RuntimeError("UCDP release fields changed. Review the adapter.")
snapshot = {"source": source, "index": INDEX, "version": version, "retrievedAt": datetime.now(timezone.utc).isoformat(), "data": [{column: row[column] for column in columns} for row in rows]}
output = Path(__file__).resolve().parent.parent / "app/data/ucdpEvents.json"
output.write_text(json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False))
print(json.dumps({"events": len(rows), "source": source, "version": version, "bytes": output.stat().st_size}))
