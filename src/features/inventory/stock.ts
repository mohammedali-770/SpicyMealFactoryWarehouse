export type StockStatus = 'negative' | 'empty' | 'ok'

/** Classify an on-hand balance for display. Negative = oversold/backorder. */
export function stockStatus(onHand: number): StockStatus {
  if (onHand < 0) return 'negative'
  if (onHand === 0) return 'empty'
  return 'ok'
}

/** Render a signed ledger quantity, e.g. 100 -> "+100", -30 -> "-30". */
export function formatSigned(quantity: number): string {
  return quantity > 0 ? `+${quantity}` : String(quantity)
}
