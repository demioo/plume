import { Box, Heading } from '@chakra-ui/react'
import { withUrqlClient } from 'next-urql'
import React from 'react'
import { EditAndDeleteButtons } from '../../components/EditAndDeleteButtons'
import { Layout } from '../../components/Layout'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl'

const Post = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl()

  if (fetching) {
    return <Layout>Loading...</Layout>
  }

  if (error) {
    return (
      <Layout>
        <Box>{error.message}</Box>
        <Box>Please try refreshing the page</Box>
      </Layout>
    )
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post</Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Heading mb={4}>{data.post?.title}</Heading>
      <Box mb={4}>{data.post?.text}</Box>
      <EditAndDeleteButtons
        id={data.post.id}
        creatorId={data.post.creator.id}
      />
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post)
