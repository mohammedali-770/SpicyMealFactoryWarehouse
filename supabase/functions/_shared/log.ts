/** One structured JSON log line per request (request id, caller, action, outcome). */
export function logRequest(entry: Record<string, unknown>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }))
}
