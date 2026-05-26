import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyAuth } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/authorize.js'
import { createBrandSchema, updateBrandSchema } from '../schemas/author.schema.js'

export const brandsApi = Router()

brandsApi.get('/', async (_req: Request, res: Response) => {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { cars: true } } },
  })
  res.json(brands)
})

brandsApi.get('/:id', async (req: Request, res: Response) => {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params['id'] as string },
    include: { cars: { select: { id: true, model: true, year: true, available: true } } },
  })
  if (!brand) {
    res.status(404).json({ error: 'Marca não encontrada' })
    return
  }
  res.json(brand)
})

brandsApi.post('/', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const result = createBrandSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const brand = await prisma.brand.create({ data: result.data })
  res.status(201).json(brand)
})

brandsApi.put('/:id', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const result = updateBrandSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const exists = await prisma.brand.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Marca não encontrada' })
    return
  }
  const brand = await prisma.brand.update({ where: { id: req.params['id'] as string }, data: result.data })
  res.json(brand)
})

brandsApi.delete('/:id', verifyAuth, requireRoles('ADMIN'), async (req: Request, res: Response) => {
  const exists = await prisma.brand.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Marca não encontrada' })
    return
  }
  await prisma.brand.delete({ where: { id: req.params['id'] as string } })
  res.status(204).send()
})
