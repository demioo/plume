import React from 'react'
import { WrapperVariant } from '../types'
import { NavBar } from './NavBar'
import { Wrapper } from './Wrapper'

interface LayoutProps {
  variant?: WrapperVariant
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  variant,
}) => {
  return (
    <>
      <NavBar />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  )
}
