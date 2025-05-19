# API Testing with OpenAPI Summary

## 1. Introduction

* **Purpose:** Consolidate discussions on using OpenAPI (Swagger) for API design,
  documentation, and contract testing.
* **Focus:** Demonstrate testing a JavaScript function that builds an API request
  object against an OpenAPI contract without live API calls.

## 2. Core Concepts

### 2.1. OpenAPI Specification (Swagger)

* Standard for describing RESTful APIs.
* Benefits: Design-first, documentation, code/test generation.
* Structure: YAML/JSON; key sections: `info`, `servers`, `paths`, `components`.

### 2.2. API Contract Testing

* Definition: Verifying consumer and provider independently adhere to a shared
  contract.
* Goal: Reliable integration, reducing need for extensive end-to-end tests.
* Perspectives: Consumer-side and Provider-side.

### 2.3. OpenAPI as the Contract

* The OpenAPI specification serves as the definitive contract.

## 3. Key Strategy: Validating Request Builder Functions

* **Scenario:** Testing a function that prepares an Axios request configuration
  object (`reqObj`) but doesn't execute the HTTP call.
* **Challenge:** Mapping `reqObj` (Axios config) to a standard HTTP request
  format for OpenAPI validators.
  * Differences: `method` case, `url` vs. `path`, `params` (query), `data`
    (body), `headers` case.
* **Solution:** Use a library (e.g., `openapi-backend` in Node.js) to validate
  the mapped `reqObj` components against the OpenAPI spec.

## 4. Detailed Example: Contract Testing a Request Builder

### 4.1. Scenario Overview

* Test a JS function (e.g., `buildGetUserProfileRequest`) returning an Axios
  config.
* Ensure this config would produce a compliant HTTP request.

### 4.2. File Structure

* `api-spec.yaml`
* `src/request-builder.js`
* `tests/request-builder.contract.test.js`
* `package.json`

### 4.3. File Content and Explanation

#### 4.3.1. `api-spec.yaml`

* **Purpose:** Defines the API contract.
* **Content:**

```yaml
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /users/{userId}/profile:
    get:
      summary: Get user profile
      operationId: getUserProfile
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: includeDetails
          in: query
          required: false
          schema:
            type: boolean
      responses:
        '200':
          description: User profile data
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                  email:
                    type: string
                    format: email
                  displayName:
                    type: string
    put:
      summary: Update user profile
      operationId: updateUserProfile
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                displayName:
                  type: string
              required:
                - email
      responses:
        '200':
          description: Update confirmation
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        '400':
          description: Invalid input
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  message:
                    type: string
```

#### 4.3.2. `src/request-builder.js`

* **Purpose:** Contains functions generating Axios request objects.
* **Content:**

```javascript
// src/request-builder.js
const BASE_URL = 'https://api.example.com/v1';

function buildGetUserProfileRequest(userId, includeDetails) {
    if (!userId) {
        throw new Error('userId is required');
    }
    const reqObj = {
        method: 'GET',
        url: `${BASE_URL}/users/${userId}/profile`,
        headers: {
            'Accept': 'application/json'
        },
        params: {},
    };
    if (includeDetails !== undefined) {
        reqObj.params.includeDetails = includeDetails;
    }
    return reqObj;
}

function buildUpdateUserProfileRequest(userId, profileData) {
     if (!userId) {
        throw new Error('userId is required');
    }
     if (!profileData || !profileData.email) {
        throw new Error('profileData with email is required');
    }
     const reqObj = {
        method: 'PUT',
        url: `${BASE_URL}/users/${userId}/profile`,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: profileData
    };
    return reqObj;
}

module.exports = { buildGetUserProfileRequest, buildUpdateUserProfileRequest };
```

#### 4.3.3. `tests/request-builder.contract.test.js`

* **Purpose:** Jest test file using `openapi-backend` to validate `request-builder.js` output.
* **Key Steps:**
    1. Initialize `openapi-backend` with `api-spec.yaml`.
    2. Helper function (`mapAxiosReqToValidationReq`) to translate Axios `reqObj` for validator.
    3. Test cases: Call builder, map `reqObj`, use `api.validateRequest()`, assert validation.
* **Content:**

```javascript
// tests/request-builder.contract.test.js
const path = require('path');
const OpenAPIBackend = require('openapi-backend').default;
const {
    buildGetUserProfileRequest,
    buildUpdateUserProfileRequest
} = require('../src/request-builder');

describe('Request Builder Contract Tests', () => {
    let api;

    beforeAll(async () => {
        api = new OpenAPIBackend({
            definition: path.resolve(__dirname, '../api-spec.yaml'),
        });
        await api.init();
    });

    function mapAxiosReqToValidationReq(reqObj) {
        const url = new URL(reqObj.url);
        const lowercasedHeaders = {};
        if (reqObj.headers) {
            for (const key in reqObj.headers) {
                lowercasedHeaders[key.toLowerCase()] = reqObj.headers[key];
            }
        }
        return {
            method: reqObj.method.toLowerCase(),
            path: url.pathname,
            query: reqObj.params,
            body: reqObj.data,
            headers: lowercasedHeaders,
        };
    }

    test('buildGetUserProfileRequest should produce a valid request object', () => {
        const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
        const includeDetails = true;
        const reqObj = buildGetUserProfileRequest(userId, includeDetails);
        const validationReq = mapAxiosReqToValidationReq(reqObj);
        const validationResult = api.validateRequest(validationReq);
        expect(validationResult.valid, `Validation Errors: ${JSON.stringify(validationResult.errors, null, 2)}`).toBe(true);
    });

    test('buildUpdateUserProfileRequest should produce a valid request object', () => {
        const userId = 'b2c3d4e5-f6a7-8901-2345-67890abcdef1';
        const profileData = { email: 'test@example.com', displayName: 'Test User' };
        const reqObj = buildUpdateUserProfileRequest(userId, profileData);
        const validationReq = mapAxiosReqToValidationReq(reqObj);
        const validationResult = api.validateRequest(validationReq);
        expect(validationResult.valid, `Validation Errors: ${JSON.stringify(validationResult.errors, null, 2)}`).toBe(true);
    });

    test('buildUpdateUserProfileRequest with missing required body property should fail validation', () => {
        const userId = 'c3d4e5f6-a7b8-9012-3456-7890abcdef12';
        const invalidProfileData = { displayName: 'Another User' }; // Missing 'email'
        let reqObj;
        try {
            reqObj = buildUpdateUserProfileRequest(userId, invalidProfileData); // Builder might throw first
        } catch (e) {
            // If builder throws due to its own validation, this path can be asserted differently
            // For this test, we assume the builder allows it, and spec validation catches it
            // Or handle this specific builder error assertion here.
             expect(e.message).toContain('email is required'); // Example if builder throws
             return;
        }

        const validationReq = mapAxiosReqToValidationReq(reqObj);
        const validationResult = api.validateRequest(validationReq);
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    message: expect.stringContaining("required property 'email'"),
                })
            ])
        );
    });
});
```

#### 4.3.4. `package.json`

* **Purpose:** Manages project dependencies and scripts.
* **Key Dependencies:** `jest`, `openapi-backend`.
* **Content:**

```json
{
  "name": "api-request-builder-contract-test-example",
  "version": "1.0.0",
  "description": "Example of contract testing an Axios request builder function using OpenAPI.",
  "main": "src/request-builder.js",
  "directories": {
    "test": "tests"
  },
  "scripts": {
    "test": "jest"
  },
  "keywords": [
    "openapi",
    "swagger",
    "contract-testing",
    "axios",
    "jest",
    "openapi-backend"
  ],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "jest": "^29.7.0",
    "openapi-backend": "^5.9.2"
  }
}
```

### 4.4. How to Run

1. Ensure Node.js and npm are installed.
2. Create the file structure (`src/`, `tests/`) and files as above.
3. Run `npm install` in the root directory (where `package.json` is).
4. Run `npm test`.

## 5. Broader Application (e.g., LLM Registry)

* This contract testing approach is valuable if any provider in a registry (like
  an LLM registry) exposes a standard REST API defined by an OpenAPI spec for
  which request objects are being built.
* For SDK-based providers (e.g., Genkit), testing typically involves mocking the
  SDK's methods rather than HTTP contract validation.

## 6. Conclusion

* Validating request builder functions against an OpenAPI contract ensures
  structural correctness before network calls.
* This enhances reliability and helps catch integration issues early.
