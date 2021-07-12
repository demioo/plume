import argon2 from 'argon2'
import { OrmContext } from 'src/types'
import { sendEmail } from '../utils/sendEmail'
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql'
import {
  FORGET_PASSWORD_PREFIX,
  FORGET_PASSWORD_TIME,
  USER_COOKIE,
} from '../constants'
import { User } from '../entities/User'
import { validateRegister } from '../utils/helpers'
import { UsernamePasswordInput } from './UsernamePasswordInput'
import { v4 } from 'uuid'

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
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: OrmContext
  ) {
    const user = await em.findOne(User, { email })
    if (!user) {
      // returning true here to prevent malicious users from phishing
      return true
    }

    const token = v4()

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      FORGET_PASSWORD_TIME
    )

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`
    )

    return true
  }

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
    const { username, password, email } = options

    const errors = validateRegister(options)
    if (errors) {
      return { errors }
    }

    const hashedPassword = await argon2.hash(password)
    const user = em.create(User, {
      username: username,
      email: email,
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
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    )
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: 'username or email does not exist',
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
