/** All money in this codebase is stored/handled as integer pence to avoid float rounding issues. */

export function formatPence(pence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}

export function poundsToPence(pounds: number) {
  return Math.round(pounds * 100);
}

export function applyPercentage(pence: number, percent: number) {
  return Math.round((pence * percent) / 100);
}
