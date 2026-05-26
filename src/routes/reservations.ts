import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyAuth } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/authorize.js'
import { createBookingSchema } from '../schemas/reservation.schema.js'

export const bookingsApi = Router()

bookingsApi.get('/', verifyAuth, async (req: Request, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.sub }
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      car: { select: { id: true, model: true, vin: true, brand: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(bookings)
})

bookingsApi.get('/:id', verifyAuth, async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params['id'] as string },
    include: {
      car: { select: { id: true, model: true, vin: true, brand: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  })
  if (!booking) {
    res.status(404).json({ error: 'Reserva não encontrada' })
    return
  }
  if (req.user!.role !== 'ADMIN' && booking.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }
  res.json(booking)
})

bookingsApi.post('/', verifyAuth, async (req: Request, res: Response) => {
  const result = createBookingSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const { carId } = result.data

  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car) {
    res.status(404).json({ error: 'Veículo não encontrado' })
    return
  }

  const alreadyBooked = await prisma.booking.findFirst({
    where: { userId: req.user!.sub, carId, status: 'PENDING' },
  })
  if (alreadyBooked) {
    res.status(400).json({ error: 'Você já possui uma reserva pendente para este veículo' })
    return
  }

  const booking = await prisma.booking.create({
    data: { userId: req.user!.sub, carId },
    include: { car: { select: { id: true, model: true } } },
  })
  res.status(201).json(booking)
})

bookingsApi.patch('/:id/confirm', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params['id'] as string } })
  if (!booking) {
    res.status(404).json({ error: 'Reserva não encontrada' })
    return
  }
  if (booking.status !== 'PENDING') {
    res.status(400).json({ error: 'Apenas reservas pendentes podem ser confirmadas' })
    return
  }
  const updated = await prisma.booking.update({
    where: { id: req.params['id'] as string },
    data: { status: 'CONFIRMED' },
    include: { car: { select: { id: true, model: true } } },
  })
  res.json(updated)
})

bookingsApi.delete('/:id', verifyAuth, async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params['id'] as string } })
  if (!booking) {
    res.status(404).json({ error: 'Reserva não encontrada' })
    return
  }
  if (req.user!.role !== 'ADMIN' && booking.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado: somente o dono pode cancelar sua reserva' })
    return
  }
  await prisma.booking.update({
    where: { id: req.params['id'] as string },
    data: { status: 'CANCELLED' },
  })
  res.status(204).send()
})
