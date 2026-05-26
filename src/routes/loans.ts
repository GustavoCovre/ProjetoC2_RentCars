import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyAuth } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/authorize.js'
import { createRentalSchema } from '../schemas/loan.schema.js'

export const rentalsApi = Router()

rentalsApi.get('/', verifyAuth, async (req: Request, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.sub }
  const rentals = await prisma.rental.findMany({
    where,
    include: {
      car: { select: { id: true, model: true, vin: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rentals)
})

rentalsApi.get('/:id', verifyAuth, async (req: Request, res: Response) => {
  const rental = await prisma.rental.findUnique({
    where: { id: req.params['id'] as string },
    include: {
      car: { select: { id: true, model: true, vin: true, brand: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  })
  if (!rental) {
    res.status(404).json({ error: 'Locação não encontrada' })
    return
  }
  if (req.user!.role !== 'ADMIN' && rental.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }
  res.json(rental)
})

rentalsApi.post('/', verifyAuth, async (req: Request, res: Response) => {
  const result = createRentalSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const { carId, dueDate } = result.data

  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car) {
    res.status(404).json({ error: 'Veículo não encontrado' })
    return
  }
  if (!car.available) {
    res.status(400).json({ error: 'Veículo não disponível para locação' })
    return
  }

  const [rental] = await prisma.$transaction([
    prisma.rental.create({
      data: { userId: req.user!.sub, carId, dueDate: new Date(dueDate) },
      include: { car: { select: { id: true, model: true } } },
    }),
    prisma.car.update({ where: { id: carId }, data: { available: false } }),
  ])

  res.status(201).json(rental)
})

rentalsApi.patch('/:id/return', verifyAuth, async (req: Request, res: Response) => {
  const rental = await prisma.rental.findUnique({ where: { id: req.params['id'] as string } })
  if (!rental) {
    res.status(404).json({ error: 'Locação não encontrada' })
    return
  }
  if (req.user!.role !== 'ADMIN' && rental.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }
  if (rental.returnedAt) {
    res.status(400).json({ error: 'Veículo já devolvido' })
    return
  }

  const [updated] = await prisma.$transaction([
    prisma.rental.update({
      where: { id: req.params['id'] as string },
      data: { returnedAt: new Date() },
      include: { car: { select: { id: true, model: true } } },
    }),
    prisma.car.update({ where: { id: rental.carId }, data: { available: true } }),
  ])

  res.json(updated)
})

rentalsApi.delete('/:id', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const exists = await prisma.rental.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Locação não encontrada' })
    return
  }
  await prisma.rental.delete({ where: { id: req.params['id'] as string } })
  res.status(204).send()
})
