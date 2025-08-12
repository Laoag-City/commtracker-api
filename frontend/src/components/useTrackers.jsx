import { useCallback, useEffect, useState } from "react";

const fetchData = async (url, token) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const fetchAttachment = async (attachmentId, mimeType, token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/files/${attachmentId}?mimeType=${mimeType}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch attachment");
    }

    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // Extract Base64
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return base64; // Return Base64 string for rendering
  } catch (error) {
    console.error("Error fetching attachment:", error.message);
    return null; // Return null if the attachment fetch fails
  }
};

const useTrackers = (token) => {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [trackersPerPage, setTrackersPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const fetchTrackersWithAttachments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch tracker data
      const response = await fetchData(
        `${import.meta.env.VITE_API_URL}/trackers?page=${currentPage}&limit=${trackersPerPage}&search=${searchQuery}`,
        token
      );

      const trackers = response.trackers || [];
      setTotalPages(response.metadata?.totalPages || 1);

      // Fetch attachments for each tracker
      const trackersWithAttachments = await Promise.all(
        trackers.map(async (tracker) => {
          if (tracker.attachment) {
            const attachmentBase64 = await fetchAttachment(
              tracker.attachment,
              tracker.attachmentMimeType,
              token
            );
            return { ...tracker, attachmentBase64 };
          } else {
            return { ...tracker, attachmentBase64: null };
          }
        })
      );

      setTrackers(trackersWithAttachments);
    } catch (error) {
      setError("Failed to fetch trackers: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, trackersPerPage, searchQuery, token]);

  useEffect(() => {
    fetchTrackersWithAttachments();
  }, [fetchTrackersWithAttachments]);

  return {
    trackers,
    loading,
    error,
    currentPage,
    setCurrentPage,
    totalPages,
    trackersPerPage,
    setTrackersPerPage,
    searchQuery,
    setSearchQuery,
  };
};

export default useTrackers;
