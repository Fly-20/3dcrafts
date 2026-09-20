import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <>
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Checkout cancelled</h1>
        <p className="mb-8 text-sm text-black/60">No payment was taken. Your cart is still saved if you&apos;d like to try again.</p>
        <Link href="/cart" className="underline">
          Back to cart
        </Link>
      </main>
    </>
  );
}
