import axios from 'axios';

/**
 * Fetch data from the API with a reusable utility function.
 * @param {string} url - The API endpoint.
 * @param {string} token - The user's authentication token.
 * @returns {Promise<any>} - The data fetched from the API.
 * @throws {Error} - If an error occurs during fetching.
 */
export async function fetchData(url, token) {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch data');
  }
}
