export const fetchData = async (url, token, method = "GET", body = null) => {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  };
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
};

/* export const uploadFile = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${import.meta.env.VITE_API_URL}/trackers/new`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const data = await response.json();
  return data.fileId; // Assuming backend returns `fileId`
};
 */

export const uploadFile = async (file, token) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/trackers/new`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData, // FormData automatically sets `multipart/form-data`
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.fileId; // Assuming backend returns `fileId`
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};