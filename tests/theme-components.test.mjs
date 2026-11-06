import assert from 'node:assert/strict';
import test from 'node:test';
import { attributes, compactCss, createLiquid, readTheme } from './helpers/liquid.mjs';

test('complementary slides show every product once, including the final partial page', async () => {
  const source = readTheme('sections/main-product.liquid');
  // Exercise the real loops while replacing the unrelated product-card renderer.
  const slides = source.match(/{%- for i in \(1\.\.number_of_slides\) -%}[\s\S]*?{%- endfor -%}\s*<\/ul>\s*<\/div>\s*{%- endfor -%}/)[0]
    .replace(/{%\s*render 'card-product',[\s\S]*?%}/, '<b data-product-id="{{ product.id }}"></b>');
  const liquid = createLiquid({ settings: { card_style: 'card' } });
  for (let count = 1; count <= 10; count++) {
    for (let perPage = 1; perPage <= 4; perPage++) {
      const products = Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
      const html = await liquid.parseAndRender(slides, {
        recommendations: { products },
        block: { id: 'recommendations', settings: { products_per_page: perPage } },
        number_of_slides: Math.ceil(count / perPage)
      });
      const pages = [...html.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/g)]
        .map(match => [...match[1].matchAll(/data-product-id="(\d+)"/g)].map(product => Number(product[1])));
      const expected = Array.from({ length: Math.ceil(count / perPage) }, (_, index) =>
        products.slice(index * perPage, (index + 1) * perPage).map(product => product.id));
      assert.deepEqual(pages, expected, `products: ${count}, per page: ${perPage}`);
    }
  }
});

test('section padding retains its scope, zero values, rounding and desktop breakpoint', async () => {
  for (const [top, bottom] of [[0, 0], [1, 3], [36, 60], [100, 25]]) {
    const html = await createLiquid().renderFile('section-padding', {
      section: { id: 'test-section', settings: { padding_top: top, padding_bottom: bottom } }
    });
    const css = compactCss(html);
    assert(css.includes(`.section-test-section-padding{padding-top:${Math.round(top * 0.75)}px;padding-bottom:${Math.round(bottom * 0.75)}px;}`));
    assert(css.includes(`@mediascreenand(min-width:750px){.section-test-section-padding{padding-top:${top}px;padding-bottom:${bottom}px;}}`));
  }
});

test('price filters retain IDs, labels, decimal values and mobile/vertical differences', async () => {
  for (const iso of ['EUR', 'USD']) {
    for (const language of ['de', 'en']) {
      const liquid = createLiquid({ cart: { currency: { iso_code: iso, symbol: iso === 'EUR' ? '€' : '$' } } }, language);
      for (const mobile of [false, true]) {
        for (const filter_type of ['horizontal', 'vertical', 'drawer']) {
          for (const [min, max] of [[null, null], [0, 150050], [12345, null], [null, 98765]]) {
            const id_prefix = mobile ? 'Mobile-Filter-' : 'Filter-';
            const html = await liquid.renderFile('facet-price-range', {
              filter: { label: 'Price & value', min_value: { value: min, param_name: 'filter.v.price.gte' }, max_value: { value: max, param_name: 'filter.v.price.lte' }, range_max: 200050 },
              filter_type, mobile, id_prefix, uses_comma_decimals: iso === 'EUR'
            });
            const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(match => attributes(match[0]));
            assert.equal(inputs.length, 2);
            for (let index = 0; index < 2; index++) {
              const value = [min, max][index], bound = index === 0 ? 'GTE' : 'LTE';
              assert.equal(inputs[index].id, `${id_prefix}Price &amp; value-${bound}`);
              assert.equal(inputs[index].name, `filter.v.price.${bound.toLowerCase()}`);
              assert.equal(inputs[index].min, '0');
              assert.equal(inputs[index].max, '2000.50');
              assert.equal(inputs[index].inputmode, mobile ? 'decimal' : undefined);
              assert.equal(inputs[index].value, value === null ? undefined : (value / 100).toFixed(2));
              assert(html.includes(`for="${inputs[index].id}"`));
            }
            assert.equal(inputs[0].placeholder, '0');
            assert.equal(inputs[1].placeholder, '2000.50');
            assert.equal((html.match(/class="field-currency"/g) ?? []).length, mobile || filter_type !== 'vertical' ? 2 : 1);
          }
        }
      }
    }
  }
});

test('active filters escape values, preserve removal URLs and omit unused price pills', async () => {
  const liquid = createLiquid({ cart: { currency: { iso_code: 'USD', symbol: '$' } } });
  const filters = [
    { label: 'Vendor', type: 'list', active_values: [{ label: '<Test>', url_to_remove: '/collections/all?filter=other' }] },
    { type: 'price_range', active_values: [], min_value: { value: null }, max_value: { value: null }, range_max: 10000, url_to_remove: '/collections/all' }
  ];
  let html = await liquid.renderFile('facet-active-filters', { filters });
  assert.equal((html.match(/<facet-remove>/g) ?? []).length, 1);
  assert(html.includes('Vendor: &lt;Test&gt;'));
  assert(html.includes('href="/collections/all?filter=other"'));
  filters[1].min_value.value = 0;
  filters[1].max_value.value = 5000;
  html = await liquid.renderFile('facet-active-filters', { filters });
  assert.equal((html.match(/<facet-remove>/g) ?? []).length, 2);
  assert(html.includes('href="/collections/all"'));
  assert.equal((html.match(/class="visually-hidden"/g) ?? []).length, 2);
});

test('marquee retains two image sets, duplicate accessibility and translated controls', async () => {
  for (const language of ['de', 'en']) {
    const html = await createLiquid({}, language).renderFile('image-marquee', {
      image_prefix: 'sliding-banner-image', image_count: 5, seconds_per_image: 10, image_width: 900, image_height: 500
    });
    for (let index = 1; index <= 5; index++) {
      assert.equal((html.match(new RegExp(`/assets/sliding-banner-image${index}\\.jpg`, 'g')) ?? []).length, 2);
    }
    assert.equal((html.match(/image-marquee__item--duplicate/g) ?? []).length, 5);
    assert(html.includes('--image-marquee-duration: 50s'));
    assert(html.includes('--image-marquee-ratio: 900 / 500'));
    assert(html.includes('tabindex="0"'));
    assert(!html.includes('Translation missing'));
    assert(readTheme('assets/component-image-marquee.css').includes('@media (prefers-reduced-motion: reduce)'));
  }
});

test('font preloads skip system fonts and retain body/heading resources', async () => {
  for (const bodySystem of [false, true]) {
    for (const headingSystem of [false, true]) {
      const liquid = createLiquid({ settings: {
        type_body_font: { family: 'Body', 'system?': bodySystem },
        type_header_font: { family: 'Heading', 'system?': headingSystem }
      } });
      const html = await liquid.renderFile('theme-font-preloads');
      assert.equal((html.match(/<link /g) ?? []).length, Number(!bodySystem) + Number(!headingSystem));
      assert.equal(html.includes('/fonts/Body.woff2'), !bodySystem);
      assert.equal(html.includes('/fonts/Heading.woff2'), !headingSystem);
    }
  }
});
