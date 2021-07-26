import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { IconButton, Link } from '@chakra-ui/react'
import React from 'react'
import NextLink from 'next/link'
import {
  useDeletePostMutation,
  useMeQuery,
} from '../generated/graphql'
import { useRouter } from 'next/router'

interface EditAndDeleteButtonsProps {
  id: number
  creatorId: number
}

export const EditAndDeleteButtons: React.FC<EditAndDeleteButtonsProps> =
  ({ id, creatorId }) => {
    const [, deletePost] = useDeletePostMutation()
    const [{ data: userData }] = useMeQuery()
    const router = useRouter()

    if (userData?.me?.id !== creatorId) {
      return null
    }

    return (
      <>
        <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
          <IconButton
            as={Link}
            mr={4}
            icon={<EditIcon />}
            colorScheme="blackAlpha"
            aria-label="Edit post"
          />
        </NextLink>
        <IconButton
          icon={<DeleteIcon />}
          colorScheme="blackAlpha"
          aria-label="Delete post"
          onClick={() => {
            deletePost({ id })
            router.push('/')
          }}
        />
      </>
    )
  }
