const OpenAPIBackend = require('openapi-backend').default;
const path = require('path');
const { buildGetUserProfileRequest, buildUpdateUserProfileRequest } = require('../src/request-builder');

describe('Request Builder Contract Tests', () => {
  let api;
  beforeAll(async () => {
    api = new OpenAPIBackend({ definition: path.join(__dirname, '../api-spec.yaml') });
    await api.init();
  });

  function mapAxiosReqToValidationReq(reqObj) {
    const url = new URL(reqObj.url);
    return {
      method: reqObj.method.toUpperCase(),
      path: url.pathname,
      query: reqObj.params || {},
      headers: reqObj.headers || {},
      body: reqObj.data,
    };
  }

  test('buildGetUserProfileRequest should produce a valid request object', () => {
    const reqObj = buildGetUserProfileRequest('user123', true);
    const validationReq = mapAxiosReqToValidationReq(reqObj);
    const validationResult = api.validateRequest(validationReq);
    expect(validationResult.valid).toBe(true);
  });

  test('buildUpdateUserProfileRequest should produce a valid request object', () => {
    const reqObj = buildUpdateUserProfileRequest('user123', { name: 'Alice', details: { age: 30 } });
    const validationReq = mapAxiosReqToValidationReq(reqObj);
    const validationResult = api.validateRequest(validationReq);
    expect(validationResult.valid).toBe(true);
  });
});
