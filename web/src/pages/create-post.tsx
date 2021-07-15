import { Box, Button } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/dist/client/router'
import React from 'react'
import { InputField } from '../components/InputField'
import { Layout } from '../components/Layout'
import { useCreatePostMutation } from '../generated/graphql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { toErrorMap } from '../utils/toErrorMap'
import { useIsAuth } from '../utils/useIsAuth'

const CreatePost: React.FC = ({}) => {
  const router = useRouter()
  useIsAuth()
  const [, createPost] = useCreatePostMutation()

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: '', text: '' }}
        onSubmit={async (values, { setErrors }) => {
          const { data, error } = await createPost({ input: values })
          if (data?.createPost.errors) {
            setErrors(toErrorMap(data?.createPost.errors))
          } else if (!error) {
            router.push('/')
          }
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
              Create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient)(CreatePost)
