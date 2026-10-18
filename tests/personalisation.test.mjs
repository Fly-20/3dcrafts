import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(source, dependencies, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name], ...globals });
  return exports;
}

const { priceCart } = load('src/lib/cart.ts', {
  './shipping': { calculateShippingPence: async () => ({ pence: 300, rate: { name: 'Standard' } }) },
});
function database(required = true, stock = 10) {
  return { from: () => ({ select: () => ({ in: async () => ({ data: [{
    id: 'variant', sku: 'KEY', status: 'active', price_pence: null, weight_grams: 20,
    stock_quantity: stock, product_id: 'product',
    products: { id: 'product', title: 'Keychain', status: 'active', base_price_pence: 500,
      vat_rate: 0.2, fulfilment_type: 'stock', personalisation_required: required },
  }], error: null }) }) }) };
}
const item = (text, quantity = 1) => ({ variantId: 'variant', quantity, personalisationText: text });

test('multiple names remain together, with no personalisation surcharge', async () => {
  const cart = await priceCart(database(), [item(' Emma, Oliver\nSophia ', 3)]);
  assert.equal(cart.lineItems[0].personalisationText, 'Emma, Oliver\nSophia');
  assert.equal(cart.subtotalPence, 1500);
  assert.equal(cart.totalPence, 1800);
});

test('required text cannot be omitted or whitespace', async () => {
  for (const text of [undefined, '', '  \n ']) {
    await assert.rejects(priceCart(database(), [item(text)]), /Please enter personalisation/);
  }
});

test('200 characters accepted, longer and malformed text rejected', async () => {
  assert.equal((await priceCart(database(), [item('A'.repeat(200))])).lineItems[0].personalisationText.length, 200);
  for (const text of ['A'.repeat(201), null, 42, {}]) {
    await assert.rejects(priceCart(database(), [item(text)]), /no more than 200/);
  }
});

test('ordinary products work and stale personalisation is rejected', async () => {
  assert.equal((await priceCart(database(false), [item(undefined)])).subtotalPence, 500);
  await assert.rejects(priceCart(database(false), [item('Emma')]), /no longer available/);
});

test('stock checks combine quantities across names for the same variant', async () => {
  await assert.rejects(priceCart(database(true, 3), [item('Emma', 2), item('Oliver', 2)]), /Only 3/);
  const cart = await priceCart(database(true, 4), [item('Emma', 2), item('Oliver', 2)]);
  assert.equal(cart.lineItems.length, 2);
});

test('invalid quantities cannot bypass stock checks', async () => {
  for (const quantity of [0, -1, 1.5, '2', NaN]) {
    await assert.rejects(priceCart(database(), [item('Emma', quantity)]), /whole-number quantity/);
  }
});

test('cart keeps different names separate and updates/removes only the chosen entry', () => {
  const storage = new Map();
  const cart = load('src/lib/cart-store.tsx', {
    react: { useCallback: (fn) => fn, useSyncExternalStore: (_, snapshot) => snapshot() },
  }, { window: { localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) } } });
  const first = { variantId: 'variant', title: 'Keychain', personalisationText: 'Emma' };
  const second = { ...first, personalisationText: 'Oliver' };
  cart.useCart().addLine(first, 1);
  cart.useCart().addLine(second, 1);
  cart.useCart().addLine(first, 2);
  assert.equal(cart.useCart().lines.length, 2);
  assert.equal(cart.useCart().lines[0].quantity, 3);
  cart.useCart().setQuantity(cart.cartLineKey(second), 4);
  assert.equal(cart.useCart().lines[0].quantity, 3);
  assert.equal(cart.useCart().lines[1].quantity, 4);
  cart.useCart().removeLine(cart.cartLineKey(first));
  assert.equal(cart.useCart().lines.length, 1);
  assert.equal(cart.useCart().lines[0].personalisationText, 'Oliver');
  assert.equal(JSON.parse(storage.get('3dcrafts_cart'))[0].personalisationText, 'Oliver');
  assert.equal(cart.cartLineKey({ variantId: 'old' }), cart.cartLineKey({ variantId: 'old', personalisationText: '' }));
});
