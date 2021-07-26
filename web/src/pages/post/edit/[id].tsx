import { Box, Button } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../../../components/InputField'
import { Layout } from '../../../components/Layout'
import {
  usePostQuery,
  useUpdatePostMutation,
} from '../../../generated/graphql'
import { createUrqlClient } from '../../../utils/createUrqlClient'
import { useGetIntId } from '../../../utils/useGetIntId'

const EditPost = ({}) => {
  const router = useRouter()
  const intId = useGetIntId()
  const [{ data, error, fetching }] = usePostQuery({
    pause: intId === -1,
    variables: {
      id: intId,
    },
  })
  const [, updatePost] = useUpdatePostMutation()

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
    <Layout variant="small">
      <Formik
        initialValues={{
          title: data.post.title,
          text: data.post.text,
        }}
        onSubmit={async (values, { setErrors }) => {
          await updatePost({
            id: intId,
            ...values,
          })

          router.push(`/post/${String(intId)}`)
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="title"
              placeholder="title"
              label="Title"
            />
            <Box mt={4}>
              <InputField
                name="text"
                placeholder="text..."
                label="Body"
                textarea
              />
            </Box>

            <Button
              type="submit"
              isLoading={isSubmitting}
              colorScheme="purple"
              mt={4}
              mr={4}
            >
              Update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(
  EditPost
)
