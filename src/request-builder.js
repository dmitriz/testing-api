const BASE_URL = 'https://api.example.com/v1';

function buildGetUserProfileRequest(userId, includeDetails) {
  return {
    method: 'get',
    url: `${BASE_URL}/users/${encodeURIComponent(userId)}/profile`,
    params: includeDetails !== undefined ? { includeDetails } : {},
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
