import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
registerHooks({
  load(url, context, nextLoad) {
    return nextLoad(url, url.endsWith('.json')
      ? { ...context, importAttributes: { type: 'json' } } : context);
  },
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !extname(specifier) && !context.parentURL.includes('/node_modules/')) {
      for (const extension of ['.ts', '.tsx', '.js']) {
        const candidate = new URL(specifier + extension, context.parentURL);
        if (existsSync(candidate)) return nextResolve(candidate.href, context);
      }
    }
    return nextResolve(specifier, specifier.endsWith('.json')
      ? { ...context, importAttributes: { type: 'json' } } : context);
  },
});
