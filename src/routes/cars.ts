import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyAuth } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/authorize.js'
import { createCarSchema, updateCarSchema } from '../schemas/car.schema.js'

export const carsApi = Router()

carsApi.get('/', async (_req: Request, res: Response) => {
  const cars = await prisma.car.findMany({
    orderBy: { model: 'asc' },
    include: { brand: { select: { id: true, name: true } } },
  })
  res.json(cars)
})

carsApi.get('/:id', async (req: Request, res: Response) => {
  const car = await prisma.car.findUnique({
    where: { id: req.params['id'] as string },
    include: {
      brand: true,
      rentals: { where: { returnedAt: null }, select: { id: true, dueDate: true } },
      bookings: { where: { status: 'PENDING' }, select: { id: true, createdAt: true } },
    },
  })
  if (!car) {
    res.status(404).json({ error: 'Veículo não encontrado' })
    return
  }
  res.json(car)
})

carsApi.post('/', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const result = createCarSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const brandExists = await prisma.brand.findUnique({ where: { id: result.data.brandId } })
  if (!brandExists) {
    res.status(404).json({ error: 'Marca não encontrada' })
    return
  }

  try {
    const car = await prisma.car.create({
      data: result.data,
      include: { brand: { select: { id: true, name: true } } },
    })
    res.status(201).json(car)
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(400).json({ error: 'VIN já cadastrado' })
      return
    }
    throw err
  }
})

carsApi.put('/:id', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const result = updateCarSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const exists = await prisma.car.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Veículo não encontrado' })
    return
  }
  if (result.data.brandId) {
    const brandExists = await prisma.brand.findUnique({ where: { id: result.data.brandId } })
    if (!brandExists) {
      res.status(404).json({ error: 'Marca não encontrada' })
      return
    }
  }
  const car = await prisma.car.update({
    where: { id: req.params['id'] as string },
    data: result.data,
    include: { brand: { select: { id: true, name: true } } },
  })
  res.json(car)
})

carsApi.delete('/:id', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const exists = await prisma.car.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Veículo não encontrado' })
    return
  }
  await prisma.car.delete({ where: { id: req.params['id'] as string } })
  res.status(204).send()
})
