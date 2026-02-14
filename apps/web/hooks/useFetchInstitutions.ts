"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { GET_ALL_EDUCATIONAL_INSTITUTIONS } from "@/utils/ApiRoutes";

const useFetchInstitutions = () => {
  const [isLoading, setInstitutionsLoading] = useState(false);
  const [hasErrors, setInstitutionsErrors] = useState<string | null>(null);
  const [data, setData] = useState([]);
  const fetchInstitutions = useCallback(async () => {
    setInstitutionsLoading(true);
    try {
      const { data } = await axios.get(GET_ALL_EDUCATIONAL_INSTITUTIONS);
      setData(data?.institutions);
    } catch (e) {
      setInstitutionsErrors(e instanceof Error ? e.message : String(e));
    } finally {
      setInstitutionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await fetchInstitutions();
    };
    fetchData();
  }, [fetchInstitutions]);
  console.log(isLoading, hasErrors, data);
  return { isLoading, hasErrors, data, refetch: fetchInstitutions };
};
export default useFetchInstitutions;
