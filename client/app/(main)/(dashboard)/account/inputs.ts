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
    name: "bio",
    type: "text",
    placeholder: "bio",
    errorMessage:
      "Bioshould be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 2,
    name: "firstname",
    type: "text",
    placeholder: "Your Firstname",
    errorMessage:
      "Firstname should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 3,
    name: "lastname",
    type: "text",
    placeholder: "Your Lastname",
    errorMessage:
      "Lastname should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 4,
    name: "address",
    type: "text",
    placeholder: "address",
    errorMessage: "It should be a valid email address!",
    required: true,
  },
];

export const securityInputs: FormInputProps[] = [
  {
    id: 5,
    name: "password",
    type: "password",
    placeholder: "Password",
    errorMessage:
      "Password should be 8-20 characters and include at least 1 letter, 1 number and 1 special character!",
    required: true,
  },
  {
    id: 6,
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm Password",
    errorMessage: "Passwords don't match!",
    required: true,
  },
];
