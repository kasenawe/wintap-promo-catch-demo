const PACKAGE_URL =
  'https://archive.ubuntu.com/ubuntu/pool/main/libg/libglvnd/libgles2_1.7.0-1build1_amd64.deb'

export default async function handler(_request, response) {
  const upstream = await fetch(PACKAGE_URL)
  if (!upstream.ok) {
    response.status(502).json({ error: `Package download failed: ${upstream.status}` })
    return
  }
  const bytes = Buffer.from(await upstream.arrayBuffer())
  response.setHeader('Content-Type', 'application/vnd.debian.binary-package')
  response.status(200).send(bytes)
}
