export function createRequestQueue(concurrency: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return async function run<T>(request: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      const start = () => { active++; resolve(); };
      if (active < concurrency) start();
      else waiting.push(start);
    });
    try { return await request(); }
    finally { active--; waiting.shift()?.(); }
  };
}
