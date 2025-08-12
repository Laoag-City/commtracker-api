// hooks/useFetchTrackers.js
import { useState, useCallback } from "react";
import { fetchData } from "../utils/api";

export function useFetchTrackers(API_ENDPOINT, token, trackersPerPage, searchQuery) {
  const [trackers, setTrackers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrackers = useCallback(async (currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData(
        `${API_ENDPOINT}/trackers?page=${currentPage}&limit=${trackersPerPage}&search=${searchQuery}`,
        token
      );
      setTrackers(response.trackers || []);
      setTotalPages(response.metadata?.totalPages || 1);
    } catch (error) {
      setError("Failed to fetch trackers: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [API_ENDPOINT, trackersPerPage, searchQuery, token]);

  return { trackers, totalPages, loading, error, fetchTrackers };
}
