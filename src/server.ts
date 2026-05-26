import 'dotenv/config'
import { buildApiApp } from './app.js'

const HTTP_PORT = process.env['PORT'] ?? 3000

const app = buildApiApp()

app.listen(HTTP_PORT, () => {
  console.log(`Acervo Fluxo em execução: http://localhost:${HTTP_PORT}`)
})
