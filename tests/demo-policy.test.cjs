const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function load(file, dependencies, result) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/\bexport /g, '');
  return new Function(...Object.keys(dependencies), source + `\nreturn ${result};`)(...Object.values(dependencies));
}

test('only the configured administrator is the shared demo account', () => {
  const env = { DEMO_MODE: 'true', DEFAULT_ADMIN_EMAIL: 'demo@example.com' };
  const policy = load('lib/demo.js', { process: { env } }, 'isDemoAccount');
  assert.equal(policy({ role: 'admin', email: 'DEMO@example.com' }), true);
  assert.equal(policy({ role: 'customer', email: 'demo@example.com' }), false);
  assert.equal(policy({ role: 'admin', email: 'other@example.com' }), false);
  env.DEMO_MODE = 'false';
  assert.equal(policy({ role: 'admin', email: 'demo@example.com' }), false);
  env.DEMO_MODE = 'true';
  delete env.DEFAULT_ADMIN_EMAIL;
  assert.equal(policy({ role: 'admin', email: 'demo@example.com' }), false);
});

test('no administrator is silently created without operator credentials', async () => {
  let created = 0;
  const bootstrap = load('lib/bootstrap.js', {
    process: { env: {} },
    User: { exists: async () => false, create: async () => { created++; } },
    dbConnect: async () => {}, hashPassword: async () => { throw new Error('must not hash'); },
    normalizeEmail: value => value.trim().toLowerCase(),
  }, 'ensureDefaultAdmin');
  await bootstrap();
  assert.equal(created, 0);
});

test('demo administrator creation is denied before body parsing or database writes', async () => {
  const post = load('app/api/admin/users/route.js', {
    process: { env: { DEMO_MODE: 'true' } }, NextResponse: Response,
    adminRoute: handler => handler,
  }, 'POST');
  const response = await post({ json: () => { throw new Error('must not parse'); } });
  assert.equal(response.status, 403);
});

for (const endpoint of ['email', 'password', '2fa']) {
  test(`shared account ${endpoint} changes are denied before parsing`, async () => {
    const post = load(`app/api/account/${endpoint}/route.js`, {
      NextResponse: Response, getCurrentUser: async () => ({ role: 'admin' }),
      isDemoAccount: () => true, DEMO_LOCK_MESSAGE: 'Locked demo account',
    }, 'POST');
    const response = await post({ json: () => { throw new Error('must not parse'); } });
    assert.equal(response.status, 403);
  });
}

for (const role of ['admin', 'customer']) {
  test(`demo team policy ${role === 'admin' ? 'blocks administrator changes' : 'preserves customer management'}`, async () => {
    let saves = 0;
    const target = { role, disabled: false, tokenVersion: 0, save: async () => { saves++; } };
    const patch = load('app/api/admin/users/[id]/route.js', {
      process: { env: { DEMO_MODE: 'true' } }, NextResponse: Response,
      mongoose: { isValidObjectId: () => true }, adminRoute: handler => handler,
      dbConnect: async () => {}, User: { findById: async () => target },
      hasPerm: () => true, isOwner: () => true, isDemoAccount: () => false,
      DEMO_LOCK_MESSAGE: 'Locked demo account',
    }, 'PATCH');
    const response = await patch({ json: async () => ({ disabled: true }) },
      { params: { id: 'target' } }, { _id: 'actor' });
    assert.equal(response.status, role === 'admin' ? 403 : 200);
    assert.equal(saves, role === 'admin' ? 0 : 1);
  });
}
