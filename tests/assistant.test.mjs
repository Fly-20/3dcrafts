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

const settingsModule = load('src/lib/pricing/settings.ts');
const engine = load('src/lib/pricing/engine.ts');
const checks = load('src/lib/pricing/checks.ts');
const reply = load('src/lib/pricing/reply.ts');
const facts = load('src/lib/crm/shop-facts.ts');
const assistant = load('src/lib/crm/assistant.ts', {
  '@/lib/pricing/engine': engine,
  '@/lib/pricing/checks': checks,
  '@/lib/pricing/reply': reply,
  './shop-facts': facts,
});
const settings = settingsModule.DEFAULT_PRICING_SETTINGS;
const plain = (value) => JSON.parse(JSON.stringify(value));

// Real enquiries, anonymised (names, links and postcode changed or removed).
const enquiries = {
  design: `Hello,\n\nI am looking to have a small, bespoke 3D-printed model made for my baby's monitor. However, I don't have an STL file as I have no experience with 3D modelling or design.\n\nI can provide photographs of the baby monitor, along with its measurements.\n\nCould you please let me know:\n1. Whether you offer a 3D design service for customers who don't already have an STL file?\n2. Whether you could create the design using photographs and measurements?\n3. What the approximate cost would be for the design and printing?\n4. Whether you would be able to share a preview of the design for approval before printing?\n\nKind regards,\nAnna`,
  makerworld: `Hi guys I'm looking to get this portable espresso stand printed and was wondering if you are able to do it?\n\nmakerworld.com/en/models/000000-espresso-stand\n\nI want it to be the best quality print possible as most others you can see the print lines and I would like it smooth exactly like the photo`,
  figures: `Hiya - I have a bit of a strange request for my 6 year old little collector. Would you be able to create a set of figures? I'm looking to create a World Cup 26 collection. That would be 48 teams and one figure per team. Thanks so much for reading x`,
  columns: `Hello\n\nI am making a 1:12 Egyptian scene and would have preferred to have the columns in one piece measuring 330mm, would that be possible? I am requesting a quote to have 2 columns printed. If they cannot be printed in a single piece, would it be possible to reduce the diameter by 50%? Please check the pieces would still interlock. Total cost inc shipping please.\nI have uploaded my files to Google Drive:\ndrive.google.com/file/d/example1/view\ndrive.google.com/file/d/example2/view\n\nRegards Beth`,
  figurine: `This is the little character I would like 3d printing he's called Hedgemonkey and he stands about an inch high. I have a STL file of it what would I need to do next to get a quote`,
};

const thread = (body) => [{ direction: 'in', body }];

/** A stand-in for the AI provider: returns canned output and records what it was asked. */
function fakeAi({ analysis, draft }) {
  const calls = [];
  return {
    calls,
    label: 'Fake',
    json: async (request) => {
      calls.push(request);
      return analysis;
    },
    text: async (request) => {
      calls.push(request);
      return typeof draft === 'function' ? draft(request) : draft;
    },
  };
}

const baseAnalysis = {
  customerName: 'Sam',
  etsyUsername: '',
  email: '',
  title: 'Hedgemonkey figurine',
  summary: '',
  quantity: 1,
  material: 'PLA',
  colours: '',
  pieceWidthMm: 0,
  pieceHeightMm: 25,
  pieceDepthMm: 0,
  deadline: '',
  isLaser: false,
  hasFile: true,
  needsDesign: false,
  quoteListingOrdered: false,
  nextStep: 'send_quote',
  reason: 'Small print from their own file.',
  customerAsked: ['What do I need to do next to get a quote?'],
  questions: ['Which colour you would like'],
  ownerTasks: ['Slice their STL'],
  risks: [],
  estimate: { printGrams: 5, printHours: 0.5, laserMinutes: 0, plywoodAreaCm2: 0, labourMinutes: 15, designHours: 0 },
};

function walkSchema(schema, path = 'root') {
  if (schema.type === 'object') {
    assert.equal(schema.additionalProperties, false, `${path}: additionalProperties must be false`);
    assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort(), `${path}: every property must be required (strict JSON schema)`);
    for (const [key, value] of Object.entries(schema.properties)) walkSchema(value, `${path}.${key}`);
  }
  if (schema.type === 'array') walkSchema(schema.items, `${path}[]`);
}

test('analysis schema is strict enough for both Claude and OpenAI structured outputs', () => {
  walkSchema(plain(assistant.ANALYSIS_SCHEMA));
});

test('normaliseAnalysis cleans up bad model output', () => {
  const analysis = assistant.normaliseAnalysis({ nextStep: 'quote_now', quantity: -3, estimate: { printGrams: 'lots', printHours: 2 }, questions: ['', 'Colour?'], etsyUsername: '@sam' });
  assert.equal(analysis.nextStep, 'ask_customer');
  assert.equal(analysis.quantity, 0);
  assert.equal(analysis.estimate.printGrams, 0);
  assert.equal(analysis.estimate.printHours, 2);
  assert.deepEqual(plain(analysis.questions), ['Colour?']);
  assert.equal(analysis.etsyUsername, 'sam');
});

test('the AI is given the whole conversation and the shop facts', async () => {
  const ai = fakeAi({ analysis: baseAnalysis, draft: '' });
  const conversation = [
    { direction: 'in', body: enquiries.figurine },
    { direction: 'out', body: 'Hi! Could you share the file?' },
    { direction: 'note', body: 'They ordered the £1 quote listing.' },
  ];
  await assistant.analyseWithAi(ai, conversation, 'etsy');
  const [call] = ai.calls;
  assert.match(call.prompt, /Hedgemonkey/);
  assert.match(call.prompt, /from="Us \(sent\)"/);
  assert.match(call.prompt, /Owner note/);
  assert.match(call.system, /256 x 256 x 256 mm/);
  assert.equal(call.schemaName, 'enquiry_analysis');
});

test('ready to quote: the price comes from the engine on the estimate, and the draft passes the checks', async () => {
  const analysis = assistant.normaliseAnalysis(baseAnalysis);
  const pricing = assistant.pricingFor({ settings, channel: 'etsy', analysis, latestQuote: null });
  assert.equal(pricing.source.kind, 'estimate');
  const standard = pricing.result.quotedPrice;
  assert.equal(standard, engine.priceQuote(settings, assistant.estimateInputs(analysis, 'etsy')).quotedPrice);

  const ai = fakeAi({ analysis: baseAnalysis, draft: (request) => `Hi Sam,\n\nThanks for your message! ${request.prompt.match(/Standard: (£[\d.]+ \+ £[\d.]+ postage)/)[1]}.\n\nThanks!` });
  const draft = await assistant.buildDraft({ ai, thread: thread(enquiries.figurine), channel: 'etsy', analysis, pricing, settings });
  assert.equal(draft.source, 'ai');
  assert.deepEqual(plain(draft.issues), []);
  assert.equal(draft.priceSource.kind, 'estimate');
  assert.match(ai.calls[0].prompt, /rough guide/, 'estimate prices are marked as a rough guide');
});

test('a saved quote is used instead of the estimate, to the penny', () => {
  const analysis = assistant.normaliseAnalysis(baseAnalysis);
  const inputs = { ...engine.EMPTY_QUOTE_INPUTS, channel: 'etsy', printGrams: 80, printHours: 4, labourMinutes: 20 };
  const pricing = assistant.pricingFor({ settings, channel: 'etsy', analysis, latestQuote: { version: 2, inputs, settings } });
  assert.deepEqual(plain(pricing.source), { kind: 'quote', version: 2 });
  assert.equal(pricing.result.quotedPrice, 2350); // worked example A on Etsy
});

test('invented prices and Etsy links in an AI draft are blocked', async () => {
  const analysis = assistant.normaliseAnalysis(baseAnalysis);
  const pricing = assistant.pricingFor({ settings, channel: 'etsy', analysis, latestQuote: null });
  const ai = fakeAi({ analysis: baseAnalysis, draft: 'Hi! It would be £7.99, or order on our website at 3dcrafts.uk for less. Thanks!' });
  const draft = await assistant.buildDraft({ ai, thread: thread(enquiries.figurine), channel: 'etsy', analysis, pricing, settings });
  const messages = draft.issues.map((issue) => issue.message).join(' ');
  assert.match(messages, /£7\.99/);
  assert.match(messages, /link or web address/);
  assert.match(messages, /website/);
});

test('the £1 quote listing may be mentioned on Etsy', async () => {
  const analysis = assistant.normaliseAnalysis({ ...baseAnalysis, nextStep: 'ask_customer', customerAsked: [], quoteListingOrdered: true });
  const ai = fakeAi({ analysis, draft: 'Hi Sam,\n\nThanks so much for ordering the £1 quote listing! Could you share the file?\n\nThanks!' });
  const draft = await assistant.buildDraft({ ai, thread: thread(enquiries.figurine), channel: 'etsy', analysis, pricing: null, settings });
  assert.deepEqual(plain(draft.issues), []);
  assert.match(ai.calls[0].prompt, /ordered the quote listing/);
});

test('asking first: no price unless they asked about cost, then only as a rough guide', async () => {
  const designEstimate = { ...baseAnalysis.estimate, printGrams: 30, printHours: 2, designHours: 2 };
  const noCost = assistant.normaliseAnalysis({ ...baseAnalysis, nextStep: 'ask_customer', customerAsked: ['Can you do it?'], estimate: designEstimate });
  const pricing = assistant.pricingFor({ settings, channel: 'etsy', analysis: noCost, latestQuote: null });
  const ai = fakeAi({ analysis: noCost, draft: 'Hi! Could you send photos? Thanks!' });
  await assistant.buildDraft({ ai, thread: thread(enquiries.design), channel: 'etsy', analysis: noCost, pricing, settings });
  assert.match(ai.calls[0].prompt, /<price_lines>none/);

  const askedCost = assistant.normaliseAnalysis({ ...noCost, customerAsked: ['What would the approximate cost be?'] });
  const ai2 = fakeAi({ analysis: askedCost, draft: 'Hi! Thanks!' });
  await assistant.buildDraft({ ai: ai2, thread: thread(enquiries.design), channel: 'etsy', analysis: askedCost, pricing, settings });
  assert.match(ai2.calls[0].prompt, /<price_lines kind="rough guide/);
});

test('if the AI draft fails to produce prices, the template still passes the checks for every next step', () => {
  for (const nextStep of ['ask_customer', 'send_quote', 'confirm_order', 'decline']) {
    for (const channel of ['etsy', 'website']) {
      const analysis = assistant.normaliseAnalysis({ ...baseAnalysis, nextStep });
      const pricing = assistant.pricingFor({ settings, channel, analysis, latestQuote: null });
      const text = assistant.templateDraft({ analysis, channel, pricing, settings });
      assert.deepEqual(plain(checks.checkDraft(text, channel, assistant.draftAllowedFigures(pricing, settings, channel))), [], `${nextStep} on ${channel}`);
      assert.match(text, /^Hi Sam,/);
    }
  }
});

test('without an AI key, the five example enquiries get a sensible first reading', () => {
  const read = Object.fromEntries(Object.entries(enquiries).map(([key, body]) => [key, assistant.analyseWithRules(thread(body))]));

  assert.equal(read.design.needsDesign, true, 'design: needs modelling');
  assert.equal(read.design.hasFile, false, "design: they don't have an STL");
  assert.equal(read.design.nextStep, 'ask_customer');
  assert.equal(read.design.customerName, 'Anna');

  assert.equal(read.makerworld.hasFile, true, 'MakerWorld link counts as a file');
  assert.equal(read.makerworld.nextStep, 'send_quote');
  assert.ok(read.makerworld.ownerTasks.some((task) => /slice/i.test(task)));

  assert.equal(read.columns.hasFile, true, 'Google Drive files');
  assert.equal(read.columns.pieceWidthMm, 330);

  assert.equal(read.figures.nextStep, 'ask_customer');

  for (const [key, analysis] of Object.entries(read)) {
    const text = assistant.templateDraft({ analysis, channel: 'etsy', pricing: null, settings });
    assert.deepEqual(plain(checks.checkDraft(text, 'etsy', assistant.draftAllowedFigures(null, settings, 'etsy'))), [], `${key}: template passes the Etsy checks`);
  }
});

test('a customer accepting a sent quote is read as wanting to go ahead', () => {
  const analysis = assistant.analyseWithRules([
    { direction: 'in', body: enquiries.figurine },
    { direction: 'out', body: 'Hi! Standard: £6.50 + £3.99 postage. Thanks!' },
    { direction: 'in', body: 'Yes please, go ahead!' },
  ]);
  assert.equal(analysis.nextStep, 'confirm_order');
  assert.equal(assistant.STATUS_AFTER_SENDING[analysis.nextStep], 'accepted');
});

test('short answers in a reply count, and a "quote" reply with no price suggests Needs info', () => {
  const analysis = assistant.analyseWithRules([
    { direction: 'in', body: enquiries.figurine },
    { direction: 'out', body: 'Hi! How many would you like, which colour, and when do you need it?' },
    { direction: 'in', body: "Just 1 please, in green, no rush. I've shared the STL on Google Drive." },
  ]);
  assert.equal(analysis.quantity, 1);
  assert.equal(analysis.colours, 'green');
  assert.deepEqual(plain(analysis.questions), []);
  assert.equal(assistant.statusAfterSending('send_quote', false), 'needs_info');
  assert.equal(assistant.statusAfterSending('send_quote', true), 'quote_sent');
  assert.equal(assistant.statusAfterSending('ask_customer', false), 'needs_info');
});
