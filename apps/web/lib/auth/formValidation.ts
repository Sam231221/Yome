export const NAME_PATTERN = "^[A-Za-z][A-Za-z' -]{1,39}$";
export const USERNAME_PATTERN = "^[A-Za-z0-9._@-]{3,24}$";
export const EMAIL_PATTERN = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
export const BIO_PATTERN = "^.{0,160}$";
export const PASSWORD_PATTERN =
  "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$";

export const PASSWORD_ERROR_MESSAGE =
  "Password must be 8-64 characters and include at least one letter, one number, and one special character.";

export const CONFIRM_PASSWORD_ERROR_MESSAGE =
  "Confirmation must match the new password exactly.";

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizeText = (value: string) => value.trim();

export const passwordsMatch = (left: string, right: string) => left === right;
