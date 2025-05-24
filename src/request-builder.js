const BASE_URL = 'https://api.example.com/v1';

function buildGetUserProfileRequest(userId, includeDetails) {
  const url = `${BASE_URL}/users/${encodeURIComponent(userId)}/profile`;
  const config = {
    method: 'get',
    url: url,
    headers: {
      'Accept': 'application/json',
    },
  };
  if (includeDetails !== undefined && includeDetails !== null) {
    config.params = { includeDetails };
  }
  return config;
}

function buildUpdateUserProfileRequest(userId, profileData) {
  const url = `${BASE_URL}/users/${encodeURIComponent(userId)}/profile`;
  return {
    method: 'put',
    url: url,
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
