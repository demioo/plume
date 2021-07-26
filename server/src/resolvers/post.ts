import { Upvote } from 'entities/Upvote'
import { isAuth } from 'middleware/isAuth'
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql'
import { getConnection } from 'typeorm'
import { OrmContext } from 'types'
import {
  PaginatedPosts,
  PostInput,
  PostResponse,
} from 'utils/fieldTypes'
import { Post } from '../entities/Post'

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50)
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: OrmContext
  ) {
    const isUpvote = value !== -1
    const realValue = isUpvote ? 1 : -1

    const { userId } = req.session

    const upvote = await Upvote.findOne({ where: { postId, userId } })

    if (upvote && upvote.value !== realValue) {
      // user has already voted on the post
      // and they are changing their vote
      await getConnection().transaction(
        async (transactionManager) => {
          await transactionManager.query(
            `
              UPDATE upvote 
              SET VALUE = $1
              WHERE "postId" = $2 and "userId" = $3
            `,
            [realValue, postId, userId]
          )

          await transactionManager.query(
            `
              UPDATE post 
              SET points = points + $1
              WHERE id = $2
            `,
            [2 * realValue, postId]
          )
        }
      )
    } else if (!upvote) {
      // user hasn't voted yet
      await getConnection().transaction(
        async (transactionManager) => {
          await transactionManager.query(
            `
              INSERT INTO upvote ("userId", "postId", value)
              values($1, $2, $3) 
            `,
            [userId, postId, realValue]
          )

          await transactionManager.query(
            `
              UPDATE post
              SET points = points + $1
              WHERE id = $2
            `,
            [realValue, postId]
          )
        }
      )
    }

    return true
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true })
    @Ctx()
    { req }: OrmContext,
    cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit)
    const realLimitPlusOne = realLimit + 1

    const userId = req.session.userId

    const replacements: any[] = [realLimitPlusOne]

    if (userId) {
      replacements.push(userId)
    }

    let cursorIdx = 3
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)))
      cursorIdx = replacements.length
    }

    const posts = await getConnection().query(
      `
        SELECT p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email,
          'createdAt', u."createdAt",
          'updatedAt', u."updatedAt"
          ) creator,
        ${
          userId
            ? '(SELECT value from upvote WHERE "userId" = $2 and "postId" = p.id) "voteStatus"'
            : 'null as "voteStatus"'
        }
        FROM post p
        INNER JOIN public.user u ON u.id = p."creatorId"
        ${cursor ? `WHERE p."createdAt" < $${cursorIdx}` : ''}
        ORDER BY p."createdAt" DESC
        LIMIT $1
      `,
      replacements
    )

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    }
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ['creator'] })
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: OrmContext
  ): Promise<PostResponse> {
    if (!input.title) {
      return {
        errors: [
          {
            field: 'title',
            message: 'title can not be empty',
          },
        ],
      }
    }

    if (!input.text) {
      return {
        errors: [
          {
            field: 'text',
            message: 'body can not be empty',
          },
        ],
      }
    }

    const post = await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save()

    return { post }
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx()
    { req }: OrmContext
  ): Promise<Post | undefined> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute()

    return result.raw[0]
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: OrmContext
  ): Promise<boolean> {
    try {
      const post = await Post.findOne(id)
      if (!post) {
        return false
      }

      if (post.creatorId !== req.session.userId) {
        throw new Error('not authorised')
      }

      await Upvote.delete({ postId: id })

      await Post.delete({ id, creatorId: req.session.userId })
    } catch {
      return false
    }
    return true
  }
}
