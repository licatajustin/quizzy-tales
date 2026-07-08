export const DELETE_ACCOUNT_CONFIRMATION_PHRASE = "delete my account"

export function isDeleteAccountConfirmationValid(input: string) {
  return (
    input.trim().toLowerCase() === DELETE_ACCOUNT_CONFIRMATION_PHRASE
  )
}
