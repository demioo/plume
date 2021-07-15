import {
  ComponentWithAs,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react'
import { useField } from 'formik'
import React, { InputHTMLAttributes } from 'react'

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string
  label: string
  placeholder: string
  textarea?: boolean
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  textarea,
  size: _,
  ...props
}) => {
  const InputOrTextArea: ComponentWithAs<'input' | 'textarea'> =
    textarea ? Textarea : Input

  const [field, { error }] = useField(props)

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <InputOrTextArea
        {...field}
        {...props}
        id={field.name}
        placeholder={placeholder}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  )
}
