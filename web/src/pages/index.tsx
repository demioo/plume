import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import NextLink from 'next/link'
import React, { useState } from 'react'
import { EditAndDeleteButtons } from '../components/EditAndDeleteButtons'
import { Layout } from '../components/Layout'
import { VoteSection } from '../components/VoteSection'
import { useMeQuery, usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { isServer } from '../utils/isServer'

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  })
  const [{ data, fetching }] = usePostsQuery({
    variables,
  })
  const [{ data: userData }] = useMeQuery({
    pause: isServer(),
  })

  if (!fetching && !data) {
    return (
      <div>Something went wrong. Please try reloading the page</div>
    )
  }

  return (
    <Layout>
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((post) => {
            return !post ? null : (
              <Flex p={5} key={post.id} shadow="md" borderWidth="1px">
                <VoteSection post={post} />
                <Box flex={1}>
                  <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize="xl">{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {post.creator.username}</Text>
                  <Flex align="center">
                    <Text flex={1} mt={4}>
                      {post.textSnippet}
                    </Text>
                    <Box ml="auto">
                      <EditAndDeleteButtons
                        id={post.id}
                        creatorId={post.creator.id}
                      />
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            )
          })}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor:
                  data.posts.posts[data.posts.posts.length - 1]
                    .createdAt,
              })
            }}
            isLoading={fetching}
            mx="auto"
            my={8}
            variant="solid"
            colorScheme="purple"
          >
            Load more
          </Button>
        </Flex>
      )}
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
