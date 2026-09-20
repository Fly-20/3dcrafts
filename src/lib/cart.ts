import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateShippingPence } from "./shipping";

export type CartItemInput = { variantId: string; quantity: number };

export type PricedLineItem = {
  variantId: string;
  productId: string;
  productTitle: string;
  sku: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  vatRate: number;
  weightGrams: number;
  fulfilmentType: string;
};

export type PricedCart = {
  lineItems: PricedLineItem[];
  subtotalPence: number;
  discountPence: number;
  discountCodeId: string | null;
  freeShippingFromDiscount: boolean;
  giftCardAppliedPence: number;
  giftCardId: string | null;
  shippingPence: number;
  shippingRateName: string | null;
  vatPence: number;
  totalPence: number;
};

export class CartPricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartPricingError";
  }
}

/**
 * Recomputes a cart's pricing entirely from the database — never trust
 * client-submitted prices/totals. Used by both /api/cart (preview) and
 * /api/checkout (to build the Stripe Checkout Session).
 *
 * Product prices are treated as VAT-inclusive (standard UK retail display),
 * so `vatPence` is the VAT *extracted* from the subtotal for invoicing, not
 * added on top of it.
 */
export async function priceCart(
  supabase: SupabaseClient,
  items: CartItemInput[],
  options: { discountCode?: string; giftCardCode?: string } = {},
): Promise<PricedCart> {
  if (items.length === 0) throw new CartPricingError("Your cart is empty.");

  const variantIds = items.map((item) => item.variantId);
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select(
      "id, sku, price_pence, weight_grams, stock_quantity, status, product_id, products!inner(id, title, status, base_price_pence, vat_rate, fulfilment_type)",
    )
    .in("id", variantIds);

  if (variantsError) throw variantsError;

  const lineItems: PricedLineItem[] = items.map((item) => {
    const variant = (variants ?? []).find((candidate) => candidate.id === item.variantId) as
      | {
          id: string;
          sku: string;
          price_pence: number | null;
          weight_grams: number;
          stock_quantity: number;
          status: string;
          product_id: string;
          products: { id: string; title: string; status: string; base_price_pence: number; vat_rate: number; fulfilment_type: string };
        }
      | undefined;

    if (!variant) throw new CartPricingError(`Product variant ${item.variantId} was not found.`);
    if (item.quantity < 1) throw new CartPricingError("Quantity must be at least 1.");
    if (variant.status !== "active" || variant.products.status !== "active") {
      throw new CartPricingError(`${variant.products.title} is no longer available.`);
    }
    if (variant.products.fulfilment_type === "stock" && item.quantity > variant.stock_quantity) {
      throw new CartPricingError(`Only ${variant.stock_quantity} of "${variant.products.title}" left in stock.`);
    }

    const unitPricePence = variant.price_pence ?? variant.products.base_price_pence;
    return {
      variantId: variant.id,
      productId: variant.product_id,
      productTitle: variant.products.title,
      sku: variant.sku,
      quantity: item.quantity,
      unitPricePence,
      lineTotalPence: unitPricePence * item.quantity,
      vatRate: variant.products.vat_rate,
      weightGrams: variant.weight_grams,
      fulfilmentType: variant.products.fulfilment_type,
    };
  });

  const subtotalPence = lineItems.reduce((sum, item) => sum + item.lineTotalPence, 0);

  let discountPence = 0;
  let discountCodeId: string | null = null;
  let freeShippingFromDiscount = false;

  if (options.discountCode) {
    const { data: discount, error: discountError } = await supabase
      .from("discount_codes")
      .select("id, type, value, starts_at, ends_at, usage_limit, times_used, active")
      .eq("code", options.discountCode.trim().toUpperCase())
      .maybeSingle();
    if (discountError) throw discountError;
    if (!discount || !discount.active) throw new CartPricingError("That discount code is not valid.");

    const now = Date.now();
    if (discount.starts_at && now < Date.parse(discount.starts_at)) throw new CartPricingError("That discount code is not active yet.");
    if (discount.ends_at && now > Date.parse(discount.ends_at)) throw new CartPricingError("That discount code has expired.");
    if (discount.usage_limit !== null && discount.times_used >= discount.usage_limit) {
      throw new CartPricingError("That discount code has reached its usage limit.");
    }

    discountCodeId = discount.id;
    if (discount.type === "percentage") discountPence = Math.round((subtotalPence * discount.value) / 100);
    else if (discount.type === "fixed") discountPence = Math.min(discount.value, subtotalPence);
    else if (discount.type === "free_shipping") freeShippingFromDiscount = true;
  }

  const totalWeightGrams = lineItems.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);
  const shippingResult = await calculateShippingPence(supabase, totalWeightGrams, subtotalPence - discountPence);
  if (!shippingResult) throw new CartPricingError("We couldn't calculate shipping for this order — please contact us.");
  const shippingPence = freeShippingFromDiscount ? 0 : shippingResult.pence;

  const vatPence = lineItems.reduce((sum, item) => {
    const lineAfterDiscount = item.lineTotalPence - Math.round((item.lineTotalPence / subtotalPence) * discountPence);
    return sum + Math.round(lineAfterDiscount - lineAfterDiscount / (1 + item.vatRate));
  }, 0);

  let giftCardAppliedPence = 0;
  let giftCardId: string | null = null;

  if (options.giftCardCode) {
    const { data: giftCard, error: giftCardError } = await supabase
      .from("gift_cards")
      .select("id, remaining_balance_pence, active")
      .eq("code", options.giftCardCode.trim().toUpperCase())
      .maybeSingle();
    if (giftCardError) throw giftCardError;
    if (!giftCard || !giftCard.active || giftCard.remaining_balance_pence <= 0) {
      throw new CartPricingError("That gift card is not valid.");
    }

    giftCardId = giftCard.id;
    const amountOwedPence = subtotalPence - discountPence + shippingPence;
    giftCardAppliedPence = Math.min(giftCard.remaining_balance_pence, amountOwedPence);
  }

  const totalPence = Math.max(0, subtotalPence - discountPence + shippingPence - giftCardAppliedPence);

  return {
    lineItems,
    subtotalPence,
    discountPence,
    discountCodeId,
    freeShippingFromDiscount,
    giftCardAppliedPence,
    giftCardId,
    shippingPence,
    shippingRateName: shippingResult.rate.name,
    vatPence,
    totalPence,
  };
}
