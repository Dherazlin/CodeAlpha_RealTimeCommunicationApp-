/**
 * Automated Verification Script for Phase 2 Authentication API
 */

async function runTests() {
  const BASE_URL = 'http://127.0.0.1:5000/api';
  const testEmail = `test_user_${Date.now()}@korus.app`;

  console.log('--- TEST 1: Health Check ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health check response:', healthData);
  if (!healthData.success) throw new Error('Health check failed');

  console.log('\n--- TEST 2: User Registration ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alex Morgan',
      email: testEmail,
      password: 'securePassword123',
    }),
  });
  const regData = await regRes.json();
  console.log('Registration status:', regRes.status);
  console.log('Registration response:', regData);
  if (regRes.status !== 201 || !regData.token || !regData.user || regData.user.password) {
    throw new Error('Registration failed or returned sensitive password');
  }

  const token = regData.token;

  console.log('\n--- TEST 3: Duplicate Email Rejection ---');
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Alex',
      email: testEmail,
      password: 'anotherPassword123',
    }),
  });
  const dupData = await dupRes.json();
  console.log('Duplicate status:', dupRes.status);
  console.log('Duplicate response:', dupData);
  if (dupRes.status !== 400 || dupData.success !== false) {
    throw new Error('Duplicate email was not properly rejected');
  }

  console.log('\n--- TEST 4: Valid User Login ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'securePassword123',
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('Login response:', loginData);
  if (loginRes.status !== 200 || !loginData.token || !loginData.user || loginData.user.password) {
    throw new Error('Login failed');
  }

  console.log('\n--- TEST 5: Invalid Password Login Rejection ---');
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'wrongPassword123',
    }),
  });
  const badLoginData = await badLoginRes.json();
  console.log('Bad login status:', badLoginRes.status);
  console.log('Bad login response:', badLoginData);
  if (badLoginRes.status !== 401 || badLoginData.success !== false) {
    throw new Error('Invalid password was not rejected with 401');
  }

  console.log('\n--- TEST 6: Get Current User /me with Bearer Token ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log('GetMe status:', meRes.status);
  console.log('GetMe response:', meData);
  if (meRes.status !== 200 || !meData.user || meData.user.email !== testEmail) {
    throw new Error('GetMe failed');
  }

  console.log('\n--- TEST 7: Get Current User /me without Token Rejection ---');
  const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
  const noTokenData = await noTokenRes.json();
  console.log('No token status:', noTokenRes.status);
  console.log('No token response:', noTokenData);
  if (noTokenRes.status !== 401 || noTokenData.success !== false) {
    throw new Error('Missing token was not rejected with 401');
  }

  console.log('\n========================================');
  console.log('ALL 7 BACKEND AUTHENTICATION TESTS PASSED!');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
