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

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true })
    cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit)
    const realLimitPlusOne = realLimit + 1

    const replacements: any[] = [realLimitPlusOne]

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)))
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
          ) creator
        FROM post p
        INNER JOIN public.user u ON u.id = p."creatorId"
        ${cursor ? `WHERE p."createdAt" < $2` : ''}
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
  post(@Arg('id') id: number): Promise<Post | undefined> {
    return Post.findOne(id)
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
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true })
    title: string
  ): Promise<Post | undefined> {
    const post = Post.findOne(id)
    if (!post) {
      return undefined
    }

    if (typeof title !== 'undefined') {
      await Post.update({ id }, { title })
    }

    return post
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    try {
      await Post.delete(id)
    } catch {
      return false
    }
    return true
  }
}
