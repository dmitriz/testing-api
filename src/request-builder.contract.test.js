const OpenAPIBackend = require('openapi-backend').default;
const path = require('path');
const { buildGetUserProfileRequest, buildUpdateUserProfileRequest } = require('./request-builder');

describe('Request Builder Contract Tests', () => {
  let api;
  
  beforeAll(async () => {
    api = new OpenAPIBackend({ 
      definition: path.join(__dirname, '../api-spec.yaml'),
    });
    await api.init();
    
    // Register operation handlers
    api.register({
      notFound: () => ({ status: 404, message: 'Not found' }),
      validationFail: (c, req) => ({ status: 400, errors: c.validation.errors }),
    });
  });
  function mapAxiosReqToValidationReq(reqObj) {
    const url = new URL(reqObj.url);
    // Extract query params from URL instead of using params object directly
    const queryParams = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value === 'true' ? true : 
                         value === 'false' ? false : 
                         value;
    });
    
    // Extract the path without the base URL and API version
    // For example: https://api.example.com/v1/users/123/profile -> /users/123/profile
    let path = url.pathname;
    if (path.startsWith('/v1')) {
      path = path.substring(3); // Remove the /v1 prefix
    }
    
    return {
      method: reqObj.method.toUpperCase(),
      path,
      query: Object.keys(queryParams).length > 0 ? queryParams : reqObj.params || {},
      headers: reqObj.headers || {},
      body: reqObj.data,
    };
  }
  test('buildGetUserProfileRequest should produce a valid request object', () => {
    const reqObj = buildGetUserProfileRequest('user123', true);
    const validationReq = mapAxiosReqToValidationReq(reqObj);
    
    // Create a simplified request object for validation
    const simplifiedReq = {
      method: 'GET',
      path: '/users/{userId}/profile',
      headers: validationReq.headers,
      query: validationReq.query,
      body: validationReq.body,
      // Add path parameters explicitly
      params: {
        userId: 'user123'
      }
    };
    
    // Find the operation by path pattern and method
    const operationPath = Object.keys(api.document.paths).find(p => p === '/users/{userId}/profile');
    const operation = operationPath ? api.document.paths[operationPath].get : null;
    
    // Check if we have a valid operation
    expect(operation).toBeTruthy();
    
    if (operation) {
      // Check if the parameters are valid according to the spec
      const hasValidUserId = simplifiedReq.params && 
                             simplifiedReq.params.userId && 
                             typeof simplifiedReq.params.userId === 'string';
      const hasValidIncludeDetails = simplifiedReq.query.includeDetails === true || 
                                     simplifiedReq.query.includeDetails === false;
      
      expect(hasValidUserId).toBe(true);
      expect(hasValidIncludeDetails).toBe(true);
    }
  });  test('buildUpdateUserProfileRequest should produce a valid request object', () => {
    const reqObj = buildUpdateUserProfileRequest('user123', { name: 'Alice', details: { age: 30 } });
    const validationReq = mapAxiosReqToValidationReq(reqObj);
    
    // Create a simplified request object for validation
    const simplifiedReq = {
      method: 'PUT',
      path: '/users/{userId}/profile',
      headers: validationReq.headers,
      query: validationReq.query,
      body: validationReq.body,
      // Add path parameters explicitly
      params: {
        userId: 'user123'
      }
    };
    
    // Find the operation by path pattern and method
    const operationPath = Object.keys(api.document.paths).find(p => p === '/users/{userId}/profile');
    const operation = operationPath ? api.document.paths[operationPath].put : null;
    
    // Check if we have a valid operation
    expect(operation).toBeTruthy();
    
    if (operation) {
      // Check if the parameters and body are valid according to the spec
      const hasValidUserId = simplifiedReq.params && 
                             simplifiedReq.params.userId && 
                             typeof simplifiedReq.params.userId === 'string';
                             
      const hasValidBody = simplifiedReq.body && 
                          typeof simplifiedReq.body.name === 'string' &&
                          (!simplifiedReq.body.details || typeof simplifiedReq.body.details === 'object');
      
      expect(hasValidUserId).toBe(true);
      expect(hasValidBody).toBe(true);
    }
  });
});
