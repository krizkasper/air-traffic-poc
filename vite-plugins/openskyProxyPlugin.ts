import type { Plugin } from 'vite'

const OPENSKY_TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'
const OPENSKY_API_BASE = 'https://opensky-network.org/api'

interface OpenSkyCredentials {
  clientId: string
  clientSecret: string
}

interface OpenSkyTokenResponse {
  access_token: string
  expires_in: number
}

function createTokenProvider({ clientId, clientSecret }: OpenSkyCredentials) {
  let cachedToken: string | null = null
  let tokenExpiresAt = 0

  return async function getToken(): Promise<string | null> {
    if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

    if (!clientId || !clientSecret) {
      console.warn('OpenSky credentials missing — falling back to anonymous access')
      return null
    }

    const response = await fetch(OPENSKY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      console.error(`OpenSky auth failed: ${response.status} ${response.statusText}`)
      return null
    }

    const data = (await response.json()) as OpenSkyTokenResponse
    cachedToken = data.access_token
    tokenExpiresAt = Date.now() + (data.expires_in - 30) * 1000
    return cachedToken
  }
}

// Proxies /opensky/* to the OpenSky REST API, attaching a cached OAuth2
// bearer token when credentials are configured (falls back to anonymous
// access otherwise, which is subject to OpenSky's much stricter rate limit).
export function openskyProxyPlugin(credentials: OpenSkyCredentials): Plugin {
  const getToken = createTokenProvider(credentials)

  return {
    name: 'opensky-proxy',
    configureServer(server) {
      server.middlewares.use('/opensky', async (req, res) => {
        const token = await getToken()
        const upstream = await fetch(`${OPENSKY_API_BASE}${req.url}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        res.statusCode = upstream.status
        res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
        res.end(Buffer.from(await upstream.arrayBuffer()))
      })
    },
  }
}
