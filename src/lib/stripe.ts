import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Stripe SDK singleton, lazily created so the module can be imported without a key present. */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured: set STRIPE_SECRET_KEY.");

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}
