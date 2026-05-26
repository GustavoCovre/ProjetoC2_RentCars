import { beforeEach, afterAll } from 'vitest'
import { prisma } from '../src/lib/prisma.js'

beforeEach(async () => {
  await prisma.booking.deleteMany()
  await prisma.rental.deleteMany()
  await prisma.car.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
