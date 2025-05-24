const BASE_URL = 'https://api.example.com/v1';

/**
 * Constructs an HTTP GET request configuration to retrieve a user's profile.
 *
 * @param {string} userId - The unique identifier of the user whose profile is being requested.
 * @param {string|number|boolean} [includeDetails] - Optional value to specify whether to include additional profile details; appended as a query parameter if provided.
 * @returns {Object} An object representing the HTTP GET request configuration, including the URL and headers.
 */
function buildGetUserProfileRequest(userId, includeDetails) {
  let url = `${BASE_URL}/users/${encodeURIComponent(userId)}/profile`;
  
  // Append query parameters to the URL if includeDetails is provided and not null
  if (includeDetails !== undefined && includeDetails !== null) {
    url += `?includeDetails=${encodeURIComponent(includeDetails)}`;
  }
  
  return {
    method: 'get',
    url: url,
    headers: {
      'Accept': 'application/json',
    },
  };
}

function buildUpdateUserProfileRequest(userId, profileData) {
  return {
    method: 'put',
    url: `${BASE_URL}/users/${encodeURIComponent(userId)}/profile`,
    data: profileData,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
}

module.exports = {
  buildGetUserProfileRequest,
  buildUpdateUserProfileRequest,
};
