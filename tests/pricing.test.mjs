import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(source, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] });
  return exports;
}

const { DEFAULT_PRICING_SETTINGS: settings, mergePricingSettings } = load('src/lib/pricing/settings.ts');
const engine = load('src/lib/pricing/engine.ts');
const { checkDraft, flagMessage, poundFigures, extractSpecsWithRules } = load('src/lib/pricing/checks.ts');
const reply = load('src/lib/pricing/reply.ts');
const { priceQuote, directCosts, EMPTY_QUOTE_INPUTS } = engine;

const jobs = {
  // A. Small part from customer STL: 80 g PLA, 4 h, 20 min labour
  A: { printGrams: 80, printHours: 4, labourMinutes: 20 },
  // B. 20 keyrings: 240 g, 5 h plate, 50 min labour
  B: { quantity: 20, printGrams: 240, printHours: 5, labourMinutes: 50 },
  // C. Designed PETG piece: 600 g, 18 h, 2 h design, 45 min labour
  C: { material: 'PETG', printGrams: 600, printHours: 18, designHours: 2, labourMinutes: 45 },
  // D. Laser wooden card: ~700 cm² plywood, 25 min laser, 25 min setup/finishing, envelope (consumables)
  D: { material: 'Plywood', plywoodAreaCm2: 700, laserMinutes: 25, labourMinutes: 25 },
};

// Brief §9.3, in pence: [direct Etsy, direct web, Etsy target, Etsy floor, web target, web floor, Etsy profit, web profit]
const expected = {
  A: { etsyDirect: 1269, webDirect: 1219, etsyTarget: 2350, etsyFloor: 1966, webTarget: 2000, webFloor: 1663, etsyProfit: 407, webProfit: 398 },
  B: { etsyDirect: 2190, webDirect: 2140, etsyTarget: 4000, etsyFloor: 3357, webTarget: 3450, webFloor: 2901, etsyProfit: 688 },
  C: { etsyDirect: 5750, webDirect: 5700, etsyTarget: 10350, etsyFloor: 8734, webTarget: 9100, webFloor: 7686, etsyProfit: 1752 },
  D: { etsyDirect: 1392, webDirect: 1342, etsyTarget: 2550, etsyFloor: 2152, webTarget: 2200, webFloor: 1829, etsyProfit: 429 },
};

const inputs = (job, channel) => ({ ...EMPTY_QUOTE_INPUTS, ...jobs[job], channel });
const pence = (pounds) => Math.round(pounds * 100);
// Values made inside the vm context have that context's Array prototype; copy before deepEqual.
const plain = (value) => JSON.parse(JSON.stringify(value));

for (const job of Object.keys(jobs)) {
  test(`worked example ${job} matches the brief on Etsy and the website`, () => {
    const want = expected[job];
    const etsy = priceQuote(settings, inputs(job, 'etsy'));
    const web = priceQuote(settings, inputs(job, 'website'));
    const [etsyStandard] = etsy.options;
    const [webStandard] = web.options;

    assert.equal(pence(etsyStandard.costs.direct), want.etsyDirect, 'Etsy direct cost');
    assert.equal(pence(webStandard.costs.direct), want.webDirect, 'web direct cost');
    assert.equal(etsyStandard.price, want.etsyTarget, 'Etsy target');
    assert.equal(etsyStandard.floor, want.etsyFloor, 'Etsy floor');
    assert.equal(webStandard.price, want.webTarget, 'web target');
    assert.equal(webStandard.floor, want.webFloor, 'web floor');
    assert.equal(etsyStandard.profit, want.etsyProfit, 'Etsy profit');
    if (want.webProfit !== undefined) assert.equal(webStandard.profit, want.webProfit, 'web profit');
  });
}

test('example A breakdown: filament £0.73, machine £0.97, labour £5.00', () => {
  const costs = directCosts(settings, inputs('A', 'etsy'));
  assert.equal(pence(costs.filament), 73);
  assert.equal(pence(costs.printer), 97);
  assert.equal(pence(costs.labour), 500);
  assert.equal(pence(costs.packaging + costs.postage + costs.acquisition), 599);
});

test('example D breakdown: plywood £1.17, laser £0.21, labour £6.25, consumables £0.30', () => {
  const costs = directCosts(settings, inputs('D', 'etsy'));
  assert.equal(pence(costs.plywood), 117);
  assert.equal(pence(costs.laser), 21);
  assert.equal(pence(costs.labour), 625);
  assert.equal(pence(costs.consumables), 30);
});

test('example B is £2.00 each on Etsy', () => {
  assert.equal(priceQuote(settings, inputs('B', 'etsy')).options[0].perUnit, 200);
});

test('Etsy item price is the total minus postage', () => {
  const [standard] = priceQuote(settings, inputs('A', 'etsy')).options;
  assert.equal(standard.etsyItemPrice, 2350 - 399);
  assert.equal(priceQuote(settings, inputs('A', 'website')).options[0].etsyItemPrice, null);
});

test('£10 minimum order and rounding up to the next 50p', () => {
  assert.equal(engine.roundPrice(settings, 3.2), 1000);
  assert.equal(engine.roundPrice(settings, 20), 2000);
  assert.equal(engine.roundPrice(settings, 20.01), 2050);
  assert.equal(engine.roundPrice(settings, 23.143), 2350);
});

test('failure buffer tiers: 5% under 6 h, 10% to 15 h, 15% above', () => {
  assert.equal(engine.printFailureRate(settings, 4), 0.05);
  assert.equal(engine.printFailureRate(settings, 6), 0.1);
  assert.equal(engine.printFailureRate(settings, 15), 0.1);
  assert.equal(engine.printFailureRate(settings, 18), 0.15);
});

test('premium costs more than standard, express adds the uplift', () => {
  const [standard, premium, express] = priceQuote(settings, inputs('C', 'etsy')).options;
  assert.ok(premium.price > standard.price);
  assert.ok(express.price >= Math.round(standard.price * 1.3) - 50);
  assert.equal(express.floor, standard.floor);
});

test('quantity breaks get cheaper per unit and include the requested quantity', () => {
  const { breaks } = priceQuote(settings, inputs('B', 'etsy'));
  const twenty = breaks.find((row) => row.quantity === 20);
  assert.equal(twenty.price, 4000, 'requested quantity reproduces the quote');
  const perUnit = breaks.map((row) => row.perUnit);
  for (let i = 1; i < perUnit.length; i++) assert.ok(perUnit[i] <= perUnit[i - 1], `per-unit price falls: ${perUnit}`);
});

test('override below floor warns, below cost blocks', () => {
  const below = priceQuote(settings, { ...inputs('A', 'etsy'), priceOverride: 19 });
  assert.ok(below.warnings.some((w) => w.level === 'warn' && /floor/.test(w.message)));
  const loss = priceQuote(settings, { ...inputs('A', 'etsy'), priceOverride: 15 });
  assert.ok(loss.warnings.some((w) => w.level === 'block'));
  assert.equal(loss.quotedPrice, 1500);
});

test('feasibility: too big for the P2S or the laser bed', () => {
  const tall = priceQuote(settings, { ...inputs('A', 'etsy'), pieceWidthMm: 100, pieceHeightMm: 100, pieceDepthMm: 300 });
  assert.ok(tall.warnings.some((w) => /P2S/.test(w.message)));
  const fits = priceQuote(settings, { ...inputs('A', 'etsy'), pieceWidthMm: 256, pieceHeightMm: 256, pieceDepthMm: 256 });
  assert.ok(!fits.warnings.some((w) => /P2S/.test(w.message)));
  const wide = priceQuote(settings, { ...inputs('D', 'etsy'), pieceWidthMm: 500, pieceHeightMm: 100 });
  assert.ok(wide.warnings.some((w) => /laser bed/.test(w.message)));
  const rotated = priceQuote(settings, { ...inputs('D', 'etsy'), pieceWidthMm: 380, pieceHeightMm: 420 });
  assert.ok(!rotated.warnings.some((w) => /laser bed/.test(w.message)));
});

test('plywood area from piece size adds a 5 mm margin each side', () => {
  const area = engine.plywoodArea(settings, { ...EMPTY_QUOTE_INPUTS, laserMinutes: 10, pieceWidthMm: 100, pieceHeightMm: 50, quantity: 2 });
  assert.equal(area, (110 * 60 / 100) * 2);
});

test('stored settings merge over the defaults and ignore junk', () => {
  const merged = mergePricingSettings({ labourPerHour: 18, postage: 'free', unknown: 1 });
  assert.equal(merged.labourPerHour, 18);
  assert.equal(merged.postage, 3.99);
  assert.equal(merged.unknown, undefined);
});

test('draft checks: £ figures must come from the quote', () => {
  assert.deepEqual(plain(poundFigures('£23.50 or £1,200 and £5')), [2350, 120000, 500]);
  assert.deepEqual(plain(checkDraft('That will be £23.50 in total.', 'website', [2350])), []);
  const issues = checkDraft('That will be £22.00 in total.', 'website', [2350]);
  assert.equal(issues[0].level, 'block');
});

test('draft checks: Etsy drafts have no links, emails, phones or website steering', () => {
  const allowed = [2350];
  for (const text of [
    'See 3dcrafts.uk for more',
    'Have a look at https://example.com',
    'Email me at someone@example.com',
    'Call 07700 900123',
    "It's cheaper if you order on our website",
  ]) {
    assert.ok(checkDraft(text, 'etsy', allowed).some((issue) => issue.level === 'block'), text);
  }
  assert.deepEqual(plain(checkDraft('Happy to make this for £23.50, I can set up a listing for you here on Etsy.', 'etsy', allowed)), []);
  assert.deepEqual(plain(checkDraft('Order on our website: 3dcrafts.uk', 'website', allowed)), []);
});

test('message flags: safety, food, copyright, children', () => {
  const kinds = (text) => flagMessage(text).map((flag) => flag.kind);
  assert.deepEqual(plain(kinds('Can you print a replacement brake lever for my car?')), ['safety']);
  assert.deepEqual(plain(kinds('20 cookie cutters for a bake sale')), ['food']);
  assert.deepEqual(plain(kinds('A Pikachu figure please')), ['copyright']);
  assert.deepEqual(plain(kinds('A name sign for a baby')), ['children']);
  assert.deepEqual(plain(kinds('A celtic knot coaster with hearts')), []);
});

test('rule-based extraction pulls quantity, size, material and missing info', () => {
  const specs = extractSpecsWithRules('Hi! Could you make 30 keyrings, about 50 x 30 mm, in red PLA, by 12th December?\n\nThanks,\nSarah');
  assert.equal(specs.quantity, 30);
  assert.equal(specs.pieceWidthMm, 50);
  assert.equal(specs.pieceHeightMm, 30);
  assert.equal(specs.material, 'PLA');
  assert.equal(specs.colours, 'red');
  assert.equal(specs.customerName, 'Sarah');
  assert.ok(specs.missingInfo.some((item) => /file/i.test(item)));
  assert.ok(!specs.missingInfo.some((item) => /colour/i.test(item)));
});

test('template reply only uses figures the checks allow, and passes the Etsy checks', () => {
  const quoteInputs = inputs('B', 'etsy');
  const result = priceQuote(settings, quoteInputs);
  const text = reply.templateReply({ customerName: 'Sarah Jones', inputs: quoteInputs, result, postagePence: 399, missingInfo: ['Colour'], summary: '20 keyrings' });
  assert.match(text, /Hi Sarah,/);
  assert.match(text, /£36\.01 \(£1\.80 each\) \+ £3\.99 postage/);
  assert.deepEqual(plain(checkDraft(text, 'etsy', reply.allowedFigures(result, 399, 20))), []);

  const webInputs = inputs('A', 'website');
  const webResult = priceQuote(settings, webInputs);
  const webText = reply.templateReply({ customerName: '', inputs: webInputs, result: webResult, postagePence: 399, missingInfo: [], summary: '' });
  assert.match(webText, /£20\.00 including VAT and postage/);
  assert.deepEqual(plain(checkDraft(webText, 'website', reply.allowedFigures(webResult, 399, 1))), []);
});
