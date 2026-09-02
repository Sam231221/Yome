import {
  BIO_PATTERN,
  CONFIRM_PASSWORD_ERROR_MESSAGE,
  NAME_PATTERN,
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_PATTERN,
  USERNAME_PATTERN,
} from "@/lib/auth/formValidation";

export interface FormInputProps {
  id: number;
  name: string;
  label?: string;
  type: string;
  placeholder: string;
  errorMessage: string;
  required: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}

export const accountInputs: FormInputProps[] = [
  {
    id: 0,
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Email address",
    errorMessage: "Enter a valid email address.",
    required: true,
    autoComplete: "email",
  },
  {
    id: 1,
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Username",
    errorMessage:
      "Username must be 3-24 characters and may include letters, numbers, dots, underscores, @, or hyphens.",
    required: true,
    pattern: USERNAME_PATTERN,
    minLength: 3,
    maxLength: 24,
    autoComplete: "username",
  },
  {
    id: 2,
    name: "bio",
    label: "Bio",
    type: "text",
    placeholder: "Short bio",
    errorMessage: "Bio must be 160 characters or fewer.",
    required: false,
    pattern: BIO_PATTERN,
    maxLength: 160,
  },
  {
    id: 3,
    name: "firstname",
    label: "First name",
    type: "text",
    placeholder: "First name",
    errorMessage:
      "First name must be 2-40 characters and can include letters, spaces, apostrophes, or hyphens.",
    required: true,
    pattern: NAME_PATTERN,
    minLength: 2,
    maxLength: 40,
    autoComplete: "given-name",
  },
  {
    id: 4,
    name: "lastname",
    label: "Last name",
    type: "text",
    placeholder: "Last name",
    errorMessage:
      "Last name must be 2-40 characters and can include letters, spaces, apostrophes, or hyphens.",
    required: true,
    pattern: NAME_PATTERN,
    minLength: 2,
    maxLength: 40,
    autoComplete: "family-name",
  },
  {
    id: 5,
    name: "address",
    label: "Address",
    type: "text",
    placeholder: "Address",
    errorMessage: "Address must be 255 characters or fewer.",
    required: false,
    maxLength: 255,
    autoComplete: "street-address",
  },
];

export const securityInputs: FormInputProps[] = [
  {
    id: 6,
    name: "currentPassword",
    label: "Current password",
    type: "password",
    placeholder: "Current Password",
    errorMessage: "Current password is required.",
    required: true,
    autoComplete: "current-password",
  },
  {
    id: 7,
    name: "newPassword",
    label: "New password",
    type: "password",
    placeholder: "New Password",
    errorMessage: PASSWORD_ERROR_MESSAGE,
    required: true,
    pattern: PASSWORD_PATTERN,
    minLength: 8,
    maxLength: 64,
    autoComplete: "new-password",
  },
  {
    id: 8,
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    placeholder: "Confirm Password",
    errorMessage: CONFIRM_PASSWORD_ERROR_MESSAGE,
    required: true,
    autoComplete: "new-password",
  },
];
