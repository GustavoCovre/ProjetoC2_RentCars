import { Request, Response, NextFunction } from 'express'

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado: permissão insuficiente' })
      return
    }
    next()
  }
}
