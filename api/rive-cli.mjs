import crypto from 'node:crypto'

const RELEASE_URL =
  'https://releases.rive.app/cli/v1.0.4/rive-linux-x64.tar.gz'
const EXPECTED_SHA256 =
  'a592c2ca578a5c87e20e0d5f6e1e755c64831e7cacd4e2b463ae6be675641157'

export default async function handler(_request, response) {
  const upstream = await fetch(RELEASE_URL)
  if (!upstream.ok) {
    response.status(502).json({ error: `Rive download failed: ${upstream.status}` })
    return
  }
  const bytes = Buffer.from(await upstream.arrayBuffer())
  const digest = crypto.createHash('sha256').update(bytes).digest('hex')
  if (digest !== EXPECTED_SHA256) {
    response.status(502).json({ error: 'Rive archive checksum mismatch' })
    return
  }
  response.setHeader('Content-Type', 'application/gzip')
  response.status(200).send(bytes)
}
