import { Box, Button, Flex, Link } from '@chakra-ui/react'
import React from 'react'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { isServer } from '../utils/isServer'

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutIsFetching }, logout] = useLogoutMutation()
  const [{ data, fetching }] = useMeQuery({
    pause: isServer()
  })
  let body = null

  if (fetching) {
  } else if (!data?.me) {
    // user is not logged in
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>Login</Link>
        </NextLink>

        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    )
  } else {
    body = (
      <Flex>
        <Box mr={4}>{data.me.username}</Box>
        <Button
          onClick={() => {
            logout()
          }}
          isLoading={logoutIsFetching}
          variant="link"
        >
          Logout
        </Button>
      </Flex>
    )
  }

  return (
    <Flex bg={'purple.300'} p={4}>
      <Box ml={'auto'}>{body}</Box>
    </Flex>
  )
}
