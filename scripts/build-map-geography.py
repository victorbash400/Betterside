"""Build compact map areas from locally downloaded official boundary deliveries."""
import json
import math
import sys
import zipfile
from pathlib import Path

def simplify(ring, tolerance=0.015):
    def segment(points):
        if len(points) < 3:
            return points
        a, b = points[0], points[-1]
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = dx * dx + dy * dy
        best, distance = 0, 0
        for i in range(1, len(points) - 1):
            p = points[i]
            t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) if length else 0
            d = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2
            if d > distance:
                best, distance = i, d
        if distance > tolerance * tolerance:
            return segment(points[:best + 1])[:-1] + segment(points[best:])
        return [a, b]
    points = segment(ring)
    return [[round(v, 5) for v in p[:2]] for p in points] if len(points) >= 4 else ring

def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:]))) / 2

def anchor(geometry):
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    polygon = max(polygons, key=lambda polygon: area(polygon[0]))
    ring = polygon[0]
    bottom, top = min(p[1] for p in ring), max(p[1] for p in ring)
    # An interior point on the widest near-middle scanline, accounting for holes.
    choices = []
    for fraction in [0.5, 0.4, 0.6, 0.3, 0.7]:
        y = bottom + (top - bottom) * fraction
        intersections = []
        for boundary in polygon:
            for a, b in zip(boundary, boundary[1:]):
                if (a[1] > y) != (b[1] > y):
                    intersections.append(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
        intersections.sort()
        for left, right in zip(intersections[::2], intersections[1::2]):
            choices.append((right - left, [(left + right) / 2, y]))
    if not choices:
        raise ValueError('No interior anchor')
    return [round(v, 5) for v in max(choices)[1]]

def compact(geometry):
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    coordinates = [[simplify(ring) for ring in polygon] for polygon in polygons]
    return {'type': 'MultiPolygon', 'coordinates': coordinates}

result = {}
for feature in json.load(open(sys.argv[1]))['features']:
    props = feature['properties']
    code = props['ISO_A3_EH'] if props['ISO_A3_EH'] != '-99' else props['ADM0_A3']
    result[code] = {'name': props['NAME_EN'], 'coordinates': anchor(feature['geometry']), 'geometry': compact(feature['geometry']), 'source': 'Natural Earth 1:110m', 'url': 'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/'}
for filename in sys.argv[2:]:
    with zipfile.ZipFile(filename) as archive:
        for name in archive.namelist():
            if not (name.endswith('.geojson') or name.endswith('.geojsonl')):
                continue
            if 'admin1' not in name.lower() and 'admin2' not in name.lower() and 'adm1' not in name.lower() and 'adm2' not in name.lower():
                continue
            content = archive.read(name).decode('utf-8-sig')
            features = [json.loads(line) for line in content.splitlines() if line.strip()] if name.endswith('.geojsonl') else json.loads(content)['features']
            for feature in features:
                props = {k.upper(): v for k, v in feature['properties'].items()}
                level = 2 if 'admin2' in name.lower() or 'adm2' in name.lower() else 1
                code = props.get(f'ADM{level}_PCODE')
                if not code:
                    raise ValueError(f'Missing p-code in {name}: {list(props)}')
                geometry = feature['geometry']
                result[code] = {'name': props.get(f'ADM{level}_EN', props.get(f'ADM{level}_NAME', code)), 'coordinates': anchor(geometry), 'geometry': compact(geometry), 'source': 'OCHA COD administrative boundaries', 'url': 'https://data.humdata.org/dataset/cod-ab-' + ('ukr' if 'ukr' in filename else 'sdn')}
Path('public/geography/areas.json').write_text(json.dumps(result, separators=(',', ':')))
print('Areas:', len(result), 'Bytes:', Path('public/geography/areas.json').stat().st_size)
