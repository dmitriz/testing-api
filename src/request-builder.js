const BASE_URL = 'https://api.example.com/v1';

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
