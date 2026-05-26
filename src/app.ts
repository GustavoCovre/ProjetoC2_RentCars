import express from 'express'
import { authModule } from './routes/auth.js'
import { brandsApi } from './routes/authors.js'
import { carsApi } from './routes/cars.js'
import { rentalsApi } from './routes/loans.js'
import { bookingsApi } from './routes/reservations.js'

export function buildApiApp() {
  const server = express()

  server.use(express.json())

  server.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() })
  })

  server.use('/auth', authModule)
  server.use('/brands', brandsApi)
  server.use('/cars', carsApi)
  server.use('/rentals', rentalsApi)
  server.use('/bookings', bookingsApi)

  server.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' })
  })

  return server
}
