import { useReducer, useEffect } from "react";
import axios from "axios";

const ACTIONS = {
  API_REQUEST: "api-request",
  FETCH_DATA: "fetch-data",
  ERROR: "error",
};

const initialState = {
  data: [],
  isLoading: false,
  hasErrors: null,
};

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.API_REQUEST:
      return { ...state, data: [], isLoading: true };
    case ACTIONS.FETCH_DATA:
      return { ...state, data: payload.institutions, isLoading: false };
    case ACTIONS.ERROR:
      return { ...state, data: [], hasErrors: payload };
    default:
      return state;
  }
}

function useFetch(url) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    dispatch({ type: ACTIONS.API_REQUEST });
    axios
      .get(url)
      .then((res) => {
        dispatch({ type: ACTIONS.FETCH_DATA, payload: res.data });
      })
      .catch((e) => {
        dispatch({ type: ACTIONS.ERROR, payload: e.error });
      });
  }, [url]);

  return state;
}

export default useFetch;
