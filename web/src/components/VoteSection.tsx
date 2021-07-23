import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { Box, Flex, IconButton } from '@chakra-ui/react'
import React, { useState } from 'react'
import {
  PostSnippetFragment,
  useVoteMutation,
} from '../generated/graphql'

interface VoteSectionProps {
  post: PostSnippetFragment
}

export const VoteSection: React.FC<VoteSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'downvote-loading' | 'not-loading'
  >('not-loading')
  const [, vote] = useVoteMutation()
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      mr={4}
    >
      <IconButton
        onClick={async () => {
          setLoadingState('upvote-loading')
          await vote({
            postId: post.id,
            value: 1,
          })
          setLoadingState('not-loading')
        }}
        isLoading={loadingState === 'upvote-loading'}
        aria-label="upvote post"
        icon={<ChevronUpIcon />}
        size="sm"
        colorScheme="purple"
        isRound
      />
      <Box my={2}>{post.points}</Box>
      <IconButton
        onClick={async () => {
          setLoadingState('downvote-loading')
          await vote({
            postId: post.id,
            value: -1,
          })
          setLoadingState('not-loading')
        }}
        isLoading={loadingState === 'downvote-loading'}
        aria-label="downvote post"
        icon={<ChevronDownIcon />}
        size="sm"
        colorScheme="purple"
        isRound
      />
    </Flex>
  )
}
