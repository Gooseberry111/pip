// Lets the phone app (which runs from capacitor://localhost or https://localhost) call these
// functions. Browsers visiting the site itself are same origin and don't need any of this.
const APP_ORIGINS = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost', 'ionic://localhost'])

function headersFor(req) {
  const origin = req.headers.get('origin')
  if (!origin || !APP_ORIGINS.has(origin)) return null
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

/** Wrap a function handler so the phone app may call it. */
export function cors(handler) {
  return async (req, context) => {
    const extra = headersFor(req)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: extra ?? {} })
    const res = await handler(req, context)
    if (!extra || !res) return res
    const headers = new Headers(res.headers)
    for (const [k, v] of Object.entries(extra)) headers.set(k, v)
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
  }
}
