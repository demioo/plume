import { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core'
import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'
import { Redis } from 'ioredis'

export type OrmContext = {
  em: EntityManager<IDatabaseDriver<Connection>>
  req: Request & {
    session: Session & Partial<SessionData> & { userId?: number }
  }
  res: Response
  redis: Redis
}
