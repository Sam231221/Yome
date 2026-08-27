import axios from "axios";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function getClientErrorMessage(
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGE
) {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.error || error.response?.data?.msg;

    if (responseMessage) {
      return responseMessage;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
