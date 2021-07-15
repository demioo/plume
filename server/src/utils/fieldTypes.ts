import { Post } from 'entities/Post'
import { User } from 'entities/User'
import { Field, InputType, ObjectType } from 'type-graphql'

@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string

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
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@InputType()
export class PostInput {
  @Field()
  title: string
  @Field()
  text: string
}

@ObjectType()
export class PostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => Post, { nullable: true })
  post?: Post
}
