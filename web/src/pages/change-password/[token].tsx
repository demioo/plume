import { Alert, AlertIcon, Box, Button, Link } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { NextPage } from 'next'
import { withUrqlClient, WithUrqlProps } from 'next-urql'
import { useRouter } from 'next/dist/client/router'
import NextLink from 'next/link'
import React, {
  FunctionComponent,
  PropsWithChildren,
  useState,
} from 'react'
import { InputField } from '../../components/InputField'
import { Wrapper } from '../../components/Wrapper'
import { useChangePasswordMutation } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { toErrorMap } from '../../utils/toErrorMap'

const ChangePassword: NextPage = () => {
  const router = useRouter()
  const [, changePassword] = useChangePasswordMutation()
  const [tokenError, setTokenError] = useState('')

  const token =
    typeof router.query.token === 'string' ? router.query.token : ''

  const buttonToDisplay = (
    tokenErrorExists: boolean,
    isSubmitting: boolean
  ) => {
    return tokenErrorExists ? (
      <Button colorScheme="purple">
        <NextLink href="/forgot-password">
          <Link>Get a new password</Link>
        </NextLink>
      </Button>
    ) : (
      <Button
        type="submit"
        isLoading={isSubmitting}
        colorScheme="purple"
      >
        Change password
      </Button>
    )
  }

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            newPassword: values.newPassword,
            token,
          })
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(
              response.data.changePassword.errors
            )
            if ('token' in errorMap) {
              setTokenError(errorMap.token)
            }
            setErrors(toErrorMap(response.data.changePassword.errors))
          } else if (response.data?.changePassword.user) {
            router.push('/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="new password"
              label="New password"
              type="password"
            />
            {tokenError ? (
              <Box>
                <Alert status="error">
                  <AlertIcon />
                  {tokenError}
                </Alert>
              </Box>
            ) : null}
            <Box mt={4}>
              {buttonToDisplay(tokenError.length > 1, isSubmitting)}
            </Box>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default withUrqlClient(createUrqlClient)(
  ChangePassword as FunctionComponent<
    PropsWithChildren<WithUrqlProps | { token: string }>
  >
)
