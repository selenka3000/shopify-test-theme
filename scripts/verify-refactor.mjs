import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createLiquid, readTheme, compactCss, parseThemeJson } from '../tests/helpers/liquid.mjs';

// Migration audit against an explicit Git revision. This is separate from the
// component contract tests and never updates expected output automatically.
const base = process.argv[2];
assert(base && /^[a-f0-9]{40}$/.test(base), 'Usage: node scripts/verify-refactor.mjs <full-base-commit>');
const git = (...args) => execFileSync('git', ['-c', 'core.safecrlf=false', ...args], { encoding: 'utf8' });
const before = file => git('show', `${base}:${file}`).replace(/\r\n/g, '\n');
const canonicalHtml = html => html.match(/<[^>]*>|[^<]+/g).map(token => {
  if (!token.startsWith('<')) return token.trim().replace(/\s+/g, ' ');
  if (token.startsWith('</')) return token.replace(/\s/g, '');
  const name = token.match(/^<([^\s/>]+)/)[1];
  const rest = token.slice(name.length + 1).replace(/\/?\s*>$/, '');
  const attrs = [...rest.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)]
    .map(match => [match[1], match[2] ?? match[3] ?? match[4] ?? ''])
    .map(([key, value]) => [key, key === 'crossorigin' && value === '' ? 'anonymous' : value]);
  return `<${name} ${JSON.stringify(attrs.sort(([a], [b]) => a.localeCompare(b)))}>`;
}).filter(Boolean).join('');
let comparisons = 0;
const cssEqual = (a, b, label) => { assert.equal(compactCss(a), compactCss(b), label); comparisons++; };
const htmlEqual = (a, b, label) => { assert.equal(canonicalHtml(a), canonicalHtml(b), label); comparisons++; };

const changed = git('diff', '--name-only', base).trim().split('\n');
let paddingSections = 0;
for (const file of changed.filter(file => file.startsWith('sections/') && file.endsWith('.liquid'))) {
  if (!readTheme(file).includes("render 'section-padding'")) continue;
  const old = before(file).match(/{%- style -%}[\s\S]*?{%- endstyle -%}/)?.[0];
  assert(old?.includes('.section-{{ section.id }}-padding'), file);
  paddingSections++;
  for (const [top, bottom] of [[0, 0], [1, 3], [36, 60], [100, 25]]) {
    const liquid = createLiquid();
    const context = { section: { id: 'test-section', settings: { padding_top: top, padding_bottom: bottom } } };
    cssEqual(await liquid.parseAndRender(old, context), await liquid.renderFile('section-padding', context), file);
  }
}
assert.equal(paddingSections, 28);

const schema = parseThemeJson(readTheme('config/settings_schema.json'));
const settings = Object.fromEntries(schema.flatMap(group => (group.settings ?? [])
  .filter(setting => 'default' in setting).map(setting => [setting.id, setting.default])));
Object.assign(settings, parseThemeJson(readTheme('config/settings_data.json')).current);
settings.type_body_font = { family: 'Body Font', fallback_families: 'sans-serif', weight: 400, style: 'normal', 'system?': false };
settings.type_header_font = { family: 'Heading Font', fallback_families: 'serif', weight: 700, style: 'normal', 'system?': false };
for (const file of ['layout/theme.liquid', 'layout/password.liquid', 'templates/gift_card.liquid']) {
  const old = before(file);
  const oldFaces = old.match(/{%- liquid\n      assign body_font_bold[\s\S]*?{{ settings.type_header_font \| font_face: font_display: 'swap' }}/)[0].replace('{% style %}', '');
  const oldPreloads = old.match(/{%- unless settings.type_body_font.system\? -%}[\s\S]*?{%- endunless -%}\s*{%- unless settings.type_header_font.system\? -%}[\s\S]*?{%- endunless -%}/)[0];
  for (const system of [false, true]) {
    const liquid = createLiquid({ settings: { ...settings, type_body_font: { ...settings.type_body_font, 'system?': system } } });
    cssEqual(await liquid.parseAndRender(oldFaces), await liquid.renderFile('theme-font-faces'), `${file} fonts`);
    htmlEqual(await liquid.parseAndRender(oldPreloads), await liquid.renderFile('theme-font-preloads'), `${file} preloads`);
  }
  if (file === 'templates/gift_card.liquid') continue;
  for (const overrides of [
    {}, { page_width: '1600', spacing_sections: 23 },
    { page_width: 1200, spacing_sections: 24, media_shadow_opacity: 0, inputs_shadow_vertical_offset: 0 },
    { spacing_sections: 25, buttons_radius: 0, variant_pills_shadow_opacity: 0 },
    { gradient_background_1: 'linear-gradient(red,blue)', gradient_background_2: '', gradient_accent_1: '', gradient_accent_2: 'linear-gradient(blue,red)' }
  ]) {
    const liquid = createLiquid({ settings: { ...settings, ...overrides } });
    cssEqual(await liquid.parseAndRender(old.match(/:root \{[\s\S]*?\n      }/)[0]),
      await liquid.renderFile('theme-css-variables', { storefront: file === 'layout/theme.liquid' }), `${file} variables`);
  }
}

const oldFacets = before('snippets/facets.liquid');
const oldPrices = [...oldFacets.matchAll(/<price-range class="facets__price">[\s\S]*?<\/price-range>/g)].map(match => match[0]);
for (const iso of ['EUR', 'USD']) for (const mobile of [false, true]) {
  for (const filter_type of ['horizontal', 'vertical', 'drawer']) for (const values of [[null, null], [0, 150050], [12345, null], [null, 98765]]) {
    const liquid = createLiquid({ cart: { currency: { iso_code: iso, symbol: iso === 'EUR' ? '€' : '$' } } });
    const context = {
      filter: { label: 'Price & value', min_value: { value: values[0], param_name: 'filter.v.price.gte' }, max_value: { value: values[1], param_name: 'filter.v.price.lte' }, range_max: 200050 },
      filter_type, mobile, id_prefix: mobile ? 'Mobile-Filter-' : 'Filter-', uses_comma_decimals: iso === 'EUR'
    };
    htmlEqual(await liquid.parseAndRender(oldPrices[Number(mobile)], context),
      await liquid.renderFile('facet-price-range', context), `price ${JSON.stringify({ iso, mobile, filter_type, values })}`);
  }
}
const pillBlocks = [...oldFacets.matchAll(/{%- for filter in results.filters -%}\s*{%- for value in filter.active_values -%}[\s\S]*?{%[- ]*endif[- ]*%}\s*{%- endfor -%}/g)].map(match => match[0]);
assert.equal(pillBlocks.length, 4);
for (const old of pillBlocks) for (const values of [[null, null], [0, null], [null, 5000], [1000, 5000]]) {
  const liquid = createLiquid({ cart: { currency: { iso_code: 'USD', symbol: '$' } } });
  const filters = [
    { label: 'Vendor', type: 'list', active_values: [{ label: '<Vendor & Co>', url_to_remove: '/collections/all?other=1' }] },
    { label: 'Price', type: 'price_range', min_value: { value: values[0] }, max_value: { value: values[1] }, range_max: 10000, url_to_remove: '/collections/all' }
  ];
  htmlEqual(await liquid.parseAndRender(old, { results: { filters } }),
    await liquid.renderFile('facet-active-filters', { filters }), `active filters ${JSON.stringify(values)}`);
}
const oldHeader = before('sections/header.liquid').match(/<script type="application\/ld\+json">[\s\S]*?{%- endif -%}\n\n(?={% schema %})/)[0];
for (const page_type of ['index', 'product']) for (const logo of ['', 'logo.png']) {
  const liquid = createLiquid({ settings: { ...settings, logo }, shop: { name: 'Test & Shop' }, request: { page_type, origin: 'https://example.test' }, routes: { search_url: '/search' }, page: { url: '/page' } });
  const json = html => [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.deepEqual(json(await liquid.parseAndRender(oldHeader)), json(await liquid.renderFile('header-structured-data')));
  comparisons++;
}

const unchanged = git('ls-tree', '-r', '--name-only', base, 'assets', 'config', 'templates',
  'locales/de.json', 'locales/de.schema.json', 'locales/en.default.json', 'locales/en.default.schema.json')
  .trim().split('\n').filter(file => !['assets/product-info.js', 'assets/selling-plans.js', 'templates/gift_card.liquid'].includes(file));
for (const file of unchanged) {
  if (file === 'config/settings_data.json') {
    // Only the inactive preset's deprecated font handles are allowed to change.
    const previous = parseThemeJson(before(file));
    const current = parseThemeJson(readTheme(file));
    assert.equal(previous.presets.Default.type_header_font, 'helvetica_n7');
    assert.equal(previous.presets.Default.type_body_font, 'helvetica_n4');
    previous.presets.Default.type_header_font = 'sans_serif_n7';
    previous.presets.Default.type_body_font = 'sans_serif_n4';
    assert.deepEqual(current, previous, `${file}: changes outside preset font migration`);
    continue;
  }
  if (['assets/image-marquee.js', 'assets/product-form.js'].includes(file)) {
    // Full-line documentation comments must not hide JavaScript logic changes.
    const withoutLineComments = text => text.replace(/^[ \t]*\/\/[^\n]*(?:\n|$)/gm, '');
    assert.equal(withoutLineComments(readTheme(file).replace(/\r\n/g, '\n')), withoutLineComments(before(file)), file);
    continue;
  }
  if (/\.(jpg|png|woff2?)$/.test(file)) {
    assert.deepEqual(readFileSync(file), execFileSync('git', ['show', `${base}:${file}`]), file);
  } else {
    assert(readTheme(file).replace(/\r\n/g, '\n') === before(file), `${file}: content changed`);
  }
}
console.log(JSON.stringify({ base, renderComparisons: comparisons, paddingSections, unchangedFiles: unchanged.length - 3,
  commentOnlyAssets: 2, verifiedPresetMigration: true, result: 'passed',
  limitation: 'LiquidJS with deterministic Shopify filter substitutes; no live storefront screenshot comparison.' }, null, 2));
