import argon2 from 'argon2'

import { User } from '../entities/User'
import { OrmContext } from 'src/types'
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql'
import { USER_COOKIE } from '../constants'

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string

  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: OrmContext) {
    if (!req.session.userId) {
      return null
    }

    const user = em.findOne(User, { id: req.session.userId })
    return user
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<UserResponse> {
    const { username, password } = options

    if (username.length <= 4) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length must be greater than 4 characters',
          },
        ],
      }
    }

    if (password.length <= 4) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length must be greater than 4 characters',
          },
        ],
      }
    }

    const hashedPassword = await argon2.hash(password)
    const user = em.create(User, {
      username: username,
      password: hashedPassword,
    })

    try {
      await em.persistAndFlush(user)
    } catch (err) {
      console.log('error message: ', err.message)
      if (err.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'username already taken',
            },
          ],
        }
      }
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<UserResponse> {
    const { username, password } = options

    const user = await em.findOne(User, { username: username })
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'username does not exist',
          },
        ],
      }
    }

    const valid = await argon2.verify(user.password, password)

    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      }
    }

    req.session.userId = user.id

    return {
      user,
    }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: OrmContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(USER_COOKIE)
        if (err) {
          console.log(err)
          resolve(false)
          return
        }

        resolve(true)
      })
    )
  }
}
