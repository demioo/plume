import { ApolloServer } from 'apollo-server-express'
import connectReddis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'
import { USER_COOKIE, __prod__ } from './constants'
import { Post } from './entities/Post'
import { User } from './entities/User'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { OrmContext } from './types'
import path from 'path'
import { Upvote } from 'entities/Upvote'
import { createUserLoader } from 'utils/createUserLoader'
import { createUpvoteLoader } from 'utils/createUpvoteLoader'

const main = async () => {
  const conn = await createConnection({
    type: 'postgres',
    database: 'plume',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true,
    entities: [Post, User, Upvote],
    migrations: [path.join(__dirname, './migrations/*')],
  })
  await conn.runMigrations()

  const app = express()

  const RedisStore = connectReddis(session)
  const redis = new Redis()

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  )

  app.use(
    session({
      name: USER_COOKIE,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, //1 year in milliseconds
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: 'temporarysecretkey',
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): OrmContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      upvoteLoader: createUpvoteLoader(),
    }),
  })

  apolloServer.applyMiddleware({
    app,
    cors: false,
  })

  app.listen(4000, () => {
    console.log('Server started on localhost:4000')
  })
}

main().catch((err) => console.error(err))
