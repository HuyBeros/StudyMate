import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { oauth2LoginApi, linkGoogleApi, request } from '../src/services/api.js';

let storage;
let events;
let originalFetch;
beforeEach(() => {
  storage = new Map([['accessToken', 'existing-access'], ['refreshToken', 'existing-refresh']]);
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  events = [];
  globalThis.window = { dispatchEvent: event => events.push(event.type) };
  originalFetch = globalThis.fetch;
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; delete globalThis.window; });

test('Google login sends only the provider and ID token, without client identity fields', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/auth/oauth2'));
    assert.deepEqual(JSON.parse(options.body), { provider: 'GOOGLE', token: 'signed-id-token' });
    return new Response(JSON.stringify({ success: true, data: { accessToken: 'new-access', refreshToken: 'new-refresh', email: 'verified@example.test', fullName: 'Verified Name', userId: 7 } }));
  };
  await oauth2LoginApi('signed-id-token');
  assert.equal(storage.get('accessToken'), 'new-access');
  assert.equal(JSON.parse(storage.get('user')).email, 'verified@example.test');
});

test('a rejected Google credential does not log out an existing user', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 401 });
  await oauth2LoginApi('invalid-token');
  await linkGoogleApi('invalid-token');
  assert.equal(storage.get('accessToken'), 'existing-access');
  assert.equal(storage.get('refreshToken'), 'existing-refresh');
  assert.deepEqual(events, []);
});

test('explicit Google linking carries current authentication and stores rotated tokens', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/auth/google/link'));
    assert.equal(options.headers.Authorization, 'Bearer existing-access');
    assert.deepEqual(JSON.parse(options.body), { provider: 'GOOGLE', token: 'verified-id-token' });
    return new Response(JSON.stringify({ success: true, data: { accessToken: 'linked-access', refreshToken: 'linked-refresh' } }));
  };
  await linkGoogleApi('verified-id-token');
  assert.equal(storage.get('accessToken'), 'linked-access');
  assert.equal(storage.get('refreshToken'), 'linked-refresh');
});

test('expired application authentication still clears the session for protected data', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 401 });
  await request('/tasks');
  assert.equal(storage.get('accessToken'), undefined);
  assert.deepEqual(events, ['auth:unauthorized']);
});

test('a late unauthorized response from a previous account cannot log out a newly signed-in account', async () => {
  let resolve;
  globalThis.fetch = () => new Promise(done => { resolve = done; });
  const oldRequest = request('/study/overview');
  storage.set('accessToken', 'different-account-access');
  resolve(new Response(JSON.stringify({ success: false }), { status: 401 }));
  await oldRequest;
  assert.equal(storage.get('accessToken'), 'different-account-access'); assert.deepEqual(events, []);
});
