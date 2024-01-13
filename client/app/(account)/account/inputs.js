export const accountInputs = [
  {
    id: 0,
    name: "email",
    type: "email",
    placeholder: "Email",
    errorMessage:
      "Email should be 3-16 characters and shouldn't include any special character!",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
    required: true,
  },
  {
    id: 1,
    name: "bio",
    type: "text",
    placeholder: "bio",
    errorMessage:
      "Bioshould be 3-16 characters and shouldn't include any special character!",
    pattern: "^[A-Za-z0-9]{3,100}$",
    required: true,
  },

  {
    id: 2,
    name: "firstname",
    type: "text",
    placeholder: "Your Firstname",
    errorMessage:
      "Firstname should be 3-16 characters and shouldn't include any special character!",
    pattern: "^[A-Za-z0-9]{3,16}$",
    required: true,
  },
  {
    id: 3,
    name: "lastname",
    type: "text",
    placeholder: "Your Lastname",
    errorMessage:
      "Lastname should be 3-16 characters and shouldn't include any special character!",
    pattern: "^[A-Za-z0-9]{3,16}$",
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

export const securityInputs = [
  {
    id: 5,
    name: "password",
    type: "password",
    placeholder: "Password",
    errorMessage:
      "Password should be 8-20 characters and include at least 1 letter, 1 number and 1 special character!",
    pattern: `^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$`,
    required: true,
  },
  {
    id: 6,
    name: "confirmPassword",
    type: "password",
    placeholder: "Confirm Password",
    errorMessage: "Passwords don't match!",
    // pattern: values.password,
    required: true,
  },
];
