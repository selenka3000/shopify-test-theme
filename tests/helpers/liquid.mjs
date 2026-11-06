import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Liquid } from 'liquidjs';

export const readTheme = file => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
export const parseThemeJson = text => JSON.parse(text.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));
export const compactCss = css => css.replace(/\s+/g, '');

// Shopify-only filters are deterministic substitutes here. Shopify Theme Check
// validates the production syntax; these tests verify component output contracts.
export function createLiquid(globals = {}, language = 'en') {
  const locale = parseThemeJson(readTheme(`locales/${language === 'en' ? 'en.default' : 'de'}.json`));
  const liquid = new Liquid({
    root: fileURLToPath(new URL('../../snippets/', import.meta.url)),
    extname: '.liquid',
    globals,
    strictFilters: true,
    cache: false
  });
  // LiquidDoc is Shopify metadata, not storefront output. LiquidJS lacks this tag.
  liquid.registerTag('doc', {
    parse(token, tokens) {
      while (tokens.length) {
        if (tokens.shift().name === 'enddoc') return;
      }
      throw new Error('Unclosed doc tag');
    },
    render() { return ''; }
  });
  liquid.registerFilter('t', key => {
    const value = key.split('.').reduce((object, part) => object?.[part], locale);
    if (typeof value !== 'string') throw new Error(`Missing test translation: ${key}`);
    return value;
  });
  liquid.registerFilter('asset_url', filename => `/assets/${filename}`);
  liquid.registerFilter('font_url', font => `/fonts/${font.family}.woff2`);
  liquid.registerFilter('font_modify', (font, property, value) => ({ ...font, [property]: value }));
  liquid.registerFilter('font_face', font =>
    `@font-face{font-family:"${font.family}";font-weight:${font.weight};font-style:${font.style};font-display:swap;}`
  );
  liquid.registerFilter('preload_tag', url =>
    `<link rel="preload" as="font" href="${url}" type="font/woff2" crossorigin="anonymous">`
  );
  const money = cents => (Number(cents) / 100).toLocaleString(
    globals.cart?.currency?.iso_code === 'EUR' ? 'de-DE' : 'en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );
  liquid.registerFilter('money_without_currency', money);
  liquid.registerFilter('money', cents => `${money(cents)} ${globals.cart?.currency?.symbol ?? '$'}`);
  liquid.registerFilter('image_url', image => `/images/${image}`);
  liquid.registerTag('style', {
    parse(token, tokens) {
      this.templates = [];
      const stream = this.liquid.parser.parseStream(tokens);
      stream.on('tag:endstyle', () => stream.stop())
        .on('template', template => this.templates.push(template))
        .on('end', () => { throw new Error('Unclosed style tag'); });
      stream.start();
    },
    *render(context, emitter) {
      emitter.write('<style data-shopify>');
      yield this.liquid.renderer.renderTemplates(this.templates, context, emitter);
      emitter.write('</style>');
    }
  });
  return liquid;
}

export function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
}
