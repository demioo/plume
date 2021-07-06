import { UsernamePasswordInput } from 'src/resolvers/UsernamePasswordInput'

export const emailIsValid = (email: string) => {
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailRegex.test(email.toLowerCase())
}

export const validateRegister = (options: UsernamePasswordInput) => {
  const { username, password, email } = options

  if (!emailIsValid(email)) {
    return [
      {
        field: 'email',
        message: 'invalid email',
      },
    ]
  }

  if (username.length <= 4) {
    return [
      {
        field: 'username',
        message: 'length must be greater than 4 characters',
      },
    ]
  }

  if (username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'cannot contain @',
      },
    ]
  }

  if (password.length <= 4) {
    return [
      {
        field: 'password',
        message: 'length must be greater than 4 characters',
      },
    ]
  }

  return null
}
