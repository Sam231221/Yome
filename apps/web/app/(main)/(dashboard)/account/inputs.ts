export interface FormInputProps {
  id: number;
  name: string;
  type: string;
  placeholder: string;
  errorMessage: string;
  required: boolean;
}

export const accountInputs: FormInputProps[] = [
  {
    id: 0,
    name: "email",
    type: "email",
    placeholder: "Email",
    errorMessage:
      "Email should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 1,
    name: "username",
    type: "text",
    placeholder: "Username",
    errorMessage: "Username is required.",
    required: true,
  },
  {
    id: 2,
    name: "bio",
    type: "text",
    placeholder: "bio",
    errorMessage:
      "Bioshould be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 3,
    name: "firstname",
    type: "text",
    placeholder: "Your Firstname",
    errorMessage:
      "Firstname should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 4,
    name: "lastname",
    type: "text",
    placeholder: "Your Lastname",
    errorMessage:
      "Lastname should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 5,
    name: "address",
    type: "text",
    placeholder: "address",
    errorMessage: "It should be a valid email address!",
    required: true,
  },
];

export const securityInputs: FormInputProps[] = [
  {
    id: 6,
    name: "currentPassword",
    type: "password",
    placeholder: "Current Password",
    errorMessage: "Current password is required.",
    required: true,
  },
  {
    id: 7,
    name: "newPassword",
    type: "password",
    placeholder: "New Password",
    errorMessage:
      "Password should be 8-20 characters and include at least 1 letter, 1 number and 1 special character!",
    required: true,
  },
  {
    id: 8,
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm Password",
    errorMessage: "Passwords don't match!",
    required: true,
  },
];
