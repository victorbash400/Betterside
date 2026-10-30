import type { MultiPolygon } from "geojson";

function longitudeDelta(longitude: number, origin: number) {
  let delta = longitude - origin;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function inRing(point: [number, number], ring: number[][]) {
  let inside = false;
  const anchor = ring[0][0];
  const longitude = longitudeDelta(point[0], anchor);
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index++
  ) {
    const x = longitudeDelta(ring[index][0], anchor) - longitude,
      y = ring[index][1] - point[1];
    const px = longitudeDelta(ring[previous][0], anchor) - longitude,
      py = ring[previous][1] - point[1];
    const cross = x * py - px * y;
    if (
      Math.abs(cross) < 1e-10 &&
      Math.min(x, px) <= 0 &&
      Math.max(x, px) >= 0 &&
      Math.min(y, py) <= 0 &&
      Math.max(y, py) >= 0
    )
      return true;
    if (y > 0 !== py > 0 && 0 < ((px - x) * -y) / (py - y) + x)
      inside = !inside;
  }
  return inside;
}

export function pointInArea(point: [number, number], area: MultiPolygon) {
  return area.coordinates.some(
    ([outer, ...holes]) =>
      inRing(point, outer) && !holes.some((hole) => inRing(point, hole)),
  );
}
