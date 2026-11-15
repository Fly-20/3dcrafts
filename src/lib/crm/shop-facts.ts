/**
 * What the assistant knows about the shop. It answers customers from this and
 * nothing else, so keep it true: edit it whenever the way you work changes.
 * Anything a customer asks that isn't covered here becomes a task for you
 * ("Decide: …") instead of a promise in the draft.
 */
export const SHOP_FACTS = `
- 3DCRAFTS is a one-person 3D printing and laser cutting business in Edinburgh, UK, selling on Etsy and its own website.
- 3D printer: Bambu Lab P2S. Largest single part is 256 x 256 x 256 mm; anything bigger is printed in sections and joined.
- Materials: PLA for most items (lots of colours, matte and silk), PETG when it needs to be tougher or more heat resistant. Multi-colour prints are possible.
- Finish: printed parts always show fine layer lines. Finer layers (the Premium option) make them much less visible; a completely smooth, glossy finish needs sanding and priming, which is extra time and not something to promise.
- Laser: xTool D1 Pro, bed 430 x 390 mm, cutting and engraving 3.6 mm plywood.
- Design service: yes. We can model things from photos, sketches and measurements; design time is charged by the hour, and the customer approves a preview image before anything is printed.
- 3D files: STL, 3MF, STEP or OBJ. Etsy messages can't carry 3D files, so customers share them through a Google Drive (or similar) link. For models from MakerWorld, Printables or Thingiverse, the owner checks the licence allows printing them to sell.
- Etsy: there's a £1 quote listing. When a buyer has ordered it, thank them for it.
- Postage: Royal Mail within the UK, included in every price (£3.99 standard). The Express option goes 1st class and jumps the queue.
- We don't make safety-critical parts (vehicle, medical, PPE, weapons, load-bearing), and we don't reproduce copyrighted or trademarked characters, team crests or brand logos unless the customer owns the rights (their own business logo is fine).
- Food contact: standard PLA isn't food-safe for repeated use.
- Children's items: small parts are a choking risk; add age guidance.
`.trim();
