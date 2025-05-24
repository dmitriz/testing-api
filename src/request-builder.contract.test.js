const OpenAPIBackend = require('openapi-backend').default;
const path = require('path');
const { buildGetUserProfileRequest, buildUpdateUserProfileRequest } = require('./request-builder');

describe('Request Builder Contract Tests', () => {
  let api;
    beforeAll(async () => {
    api = new OpenAPIBackend({ 
      definition: path.join(__dirname, '../api-spec.yaml'),
      quick: true,
      validate: true
    });
    await api.init();
    
    // Register operation handlers
    api.register({
      notFound: () => ({ status: 404, message: 'Not found' }),
      validationFail: (c, req) => ({ status: 400, errors: c.validation.errors }),
      getUserProfile: () => ({}),
      updateUserProfile: () => ({})
    });});

  // Helper function to identify the operation and validate the request
// sourcery skip: avoid-function-declarations-in-blocks
  function validateRequestAgainstSchema(reqObj) {
    // Use the server URL from the OpenAPI definition as a base for parsing reqObj.url
    // This handles both relative and absolute URLs in reqObj.url.
    const baseUrl = (api.definition && api.definition.servers && api.definition.servers.length > 0 && api.definition.servers[0].url) 
                    || 'http://localhost'; // Fallback base URL if not found in spec
    const url = new URL(reqObj.url, baseUrl);
    
    // Remove the basePath (e.g., '/v1') from the path if present
    let openapiPath = url.pathname;
    const basePath = new URL(baseUrl).pathname.replace(/\/$/, ''); // Remove trailing slash
    if (basePath && openapiPath.startsWith(basePath)) {
      openapiPath = openapiPath.slice(basePath.length) || '/';
    }

    // Extract the path parameters
    const userIdMatch = openapiPath.match(/\/users\/([^\/]+)\/profile/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    // Convert query parameters and handle booleans
    const queryParams = {};
    url.searchParams.forEach((value, key) => {
      if (key === 'includeDetails') {
        queryParams[key] = value === 'true';
      } else {
        queryParams[key] = value;
      }
    });
    
    // Create a properly formatted request for OpenAPI validation
    const req = {
      method: reqObj.method.toUpperCase(),
      path: openapiPath, // Use the path relative to the OpenAPI base
      query: queryParams,
      headers: reqObj.headers || {},
      body: reqObj.data,
    };
    
    try {
      // First find the matching operation
      const operation = api.matchOperation(req);
      if (!operation) {
        return {
          valid: false,
          errors: [{ message: `No matching operation found for ${req.method} ${req.path}` }]
        };
      }

      // Then validate the request with the found operation
      const validationResult = api.validateRequest(req, operation); 

      if (validationResult && validationResult.errors) { // Check for errors property
        return {
          valid: false,
          errors: validationResult.errors 
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message }] 
      };
    }
  }test('buildGetUserProfileRequest should produce a valid request object', () => {
    const reqObj = buildGetUserProfileRequest('user123', true);
    const validationResult = validateRequestAgainstSchema(reqObj);
    
    console.log('GET request:', JSON.stringify({
      url: reqObj.url,
      method: reqObj.method,
      params: reqObj.params,
      headers: reqObj.headers,
    }, null, 2));
    
    console.log('GET validation result:', JSON.stringify(validationResult, null, 2));
    
    expect(validationResult.valid).toBe(true);
    if (!validationResult.valid) {
      console.error('Validation errors:', validationResult.errors);
    }
  });  test('buildUpdateUserProfileRequest should produce a valid request object', () => {
    const reqObj = buildUpdateUserProfileRequest('user123', { name: 'Alice', details: { age: 30 } });
    const validationResult = validateRequestAgainstSchema(reqObj);
    
    console.log('PUT request:', JSON.stringify({
      url: reqObj.url,
      method: reqObj.method,
      body: reqObj.data,
      headers: reqObj.headers,
    }, null, 2));
    
    console.log('PUT validation result:', JSON.stringify(validationResult, null, 2));
    
    expect(validationResult.valid).toBe(true);
    if (!validationResult.valid) {
      console.error('Validation errors:', validationResult.errors);
    }
  });
});
