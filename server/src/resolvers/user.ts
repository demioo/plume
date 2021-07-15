import argon2 from 'argon2'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { OrmContext } from 'types'
import { v4 } from 'uuid'
import {
  FORGET_PASSWORD_PREFIX,
  FORGET_PASSWORD_TIME,
  USER_COOKIE,
} from '../constants'
import { User } from '../entities/User'
import {
  UsernamePasswordInput,
  UserResponse,
} from '../utils/fieldTypes'
import { validateRegister } from '../utils/helpers'
import { sendEmail } from '../utils/sendEmail'

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: OrmContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 4) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 4 characters',
          },
        ],
      }
    }

    const key = FORGET_PASSWORD_PREFIX + token
    const userId = await redis.get(key)
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      }
    }

    const userIdNum = parseInt(userId)
    const user = await User.findOne(userIdNum)

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      }
    }

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    )

    await redis.del(key)

    // log in user after password change
    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: OrmContext
  ) {
    const user = await User.findOne({ where: { email } })
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
  async me(@Ctx() { req }: OrmContext) {
    if (!req.session.userId) {
      return null
    }

    return User.findOne(req.session.userId)
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options', () => UsernamePasswordInput)
    options: UsernamePasswordInput,
    @Ctx() { req }: OrmContext
  ): Promise<UserResponse> {
    const { username, password, email } = options

    const errors = validateRegister(options)
    if (errors) {
      return { errors }
    }

    const hashedPassword = await argon2.hash(password)
    let user
    try {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
      }).save()
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

    req.session.userId = user?.id

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: OrmContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
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
