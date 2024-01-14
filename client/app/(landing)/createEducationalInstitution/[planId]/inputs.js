export const institutionsInputs = [
  {
    id: 540,
    label: "Institution Name",
    name: "name",
    type: "text",
    placeholder: "Name of your Institution",
    errorMessage:
      "Name should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 332,
    label: "Description",
    name: "description",
    type: "text",
    placeholder: "Give a short description about your institution",
    errorMessage:
      "Description should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 3004,
    label: "Name of Principal",
    name: "principal_name",
    type: "text",
    placeholder: "Enter Principal Name",
    errorMessage:
      "Principal Name should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 334,
    label: "Principal Email",
    name: "principal_email",
    type: "email",
    placeholder: "Enter Principal Email",
    errorMessage:
      "Email should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 2224,
    label: "Contact No",
    name: "contact",
    type: "tel", // assuming it's a phone number
    placeholder: "Enter Contact Number",
    errorMessage: "Contact should be a valid phone number!",
    required: true,
  },
  {
    id: 3,
    label: "Address",
    name: "address",
    type: "text",
    placeholder: "Enter Address",
    errorMessage:
      "Address should be 3-16 characters and shouldn't include any special character!",
    required: true,
  },
  {
    id: 64,
    name: "accreditation_status",
    type: "text",
    placeholder: "Accreditation Status",
    errorMessage:
      "Accreditation Status should be 3-16 characters and shouldn't include any special character!",
    required: true,
    pattern: "^[A-Za-z0-9]{3,100}$",
  },
];
