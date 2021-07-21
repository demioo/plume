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
import { Layout } from '../components/Layout'
import { usePostsQuery } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  })
  const [{ data, fetching }] = usePostsQuery({
    variables,
  })

  console.log('variables: ', variables)

  if (!fetching && !data) {
    return (
      <div>Something went wrong. Please try reloading the page</div>
    )
  }

  return (
    <Layout>
      <Flex align="center">
        <Heading>Plume</Heading>
        <NextLink href="/create-post">
          <Link ml="auto"> Create post</Link>
        </NextLink>
      </Flex>
      <br />
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.map((post) => (
            <Box p={5} key={post.id} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{post.title}</Heading>
              <Text mt={4}>{post.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      )}
      {data && (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts[data.posts.length - 1].createdAt,
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
