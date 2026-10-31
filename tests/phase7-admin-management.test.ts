import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken, verifyPassword, verifySessionToken } from '../lib/auth';
import { GET as usersGET, POST as usersPOST } from '../app/api/admin/users/route';
import { DELETE as userDELETE, PATCH as userPATCH } from '../app/api/admin/users/[id]/route';
import { POST as resetPasswordPOST } from '../app/api/admin/users/[id]/reset-password/route';
import { POST as loginPOST } from '../app/api/admin/login/route';
import { NextRequest } from 'next/server';

describe('Phase 7: User Management & Superadmin Role Control', () => {
  let db: D1Database;
  const initialSchema = fs.readFileSync(path.join(process.cwd(), 'migrations', '0001_initial_schema.sql'), 'utf8');
  const roleSchema = fs.readFileSync(path.join(process.cwd(), 'migrations', '0003_admin_roles.sql'), 'utf8');
  const namesSchema = fs.readFileSync(path.join(process.cwd(), 'migrations', '0004_update_admin_names.sql'), 'utf8');

  beforeEach(async () => {
    db = createMemoryD1Database();
    await db.exec(initialSchema);
    await db.exec(roleSchema);
    await db.exec(namesSchema);
    setTestDatabase(db);
  });

  async function makeRequest(
    url: string,
    options: { method?: string; body?: any; token?: string } = {}
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['cookie'] = `admin_session=${options.token}`;
    }
    return new NextRequest(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  it('7.1 should block unauthenticated and regular admin access to user management', async () => {
    // 1. No token -> 401
    const unauthReq = await makeRequest('http://localhost:3000/api/admin/users');
    const unauthRes = await usersGET(unauthReq);
    expect(unauthRes.status).toBe(401);

    // 2. Regular admin token -> 403
    const normalAdminToken = await createSessionToken({
      adminId: 'admin_pathaithep',
      username: 'pathaithep',
      displayName: 'พัทธเทพ',
      role: 'admin',
    });
    const regularReq = await makeRequest('http://localhost:3000/api/admin/users', { token: normalAdminToken });
    const regularRes = await usersGET(regularReq);
    expect(regularRes.status).toBe(403);
  });

  it('7.2 should allow superadmin to list all admin accounts', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    const req = await makeRequest('http://localhost:3000/api/admin/users', { token: superadminToken });
    const res = await usersGET(req);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.users).toHaveLength(3);

    const chookait = data.users.find((u: any) => u.username === 'chookait');
    expect(chookait).toBeDefined();
    expect(chookait.role).toBe('superadmin');

    const pathaithep = data.users.find((u: any) => u.username === 'pathaithep');
    expect(pathaithep).toBeDefined();
    expect(pathaithep.role).toBe('admin');
  });

  it('7.3 should allow superadmin to reset password for another admin and allow login with new password', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    // Reset password for pathaithep to 'NewPass@2026'
    const resetReq = await makeRequest('http://localhost:3000/api/admin/users/admin_pathaithep/reset-password', {
      method: 'POST',
      body: { new_password: 'NewPass@2026' },
      token: superadminToken,
    });
    const resetRes = await resetPasswordPOST(resetReq, { params: Promise.resolve({ id: 'admin_pathaithep' }) });
    expect(resetRes.status).toBe(200);

    const resetData: any = await resetRes.json();
    expect(resetData.success).toBe(true);

    // Verify pathaithep can now log in with NewPass@2026
    const loginReq = await makeRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: { username: 'pathaithep', password: 'NewPass@2026' },
    });
    const loginRes = await loginPOST(loginReq);
    const loginData: any = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginData.success).toBe(true);
    expect(loginData.admin.username).toBe('pathaithep');

    // Verify old password no longer works
    const oldLoginReq = await makeRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: { username: 'pathaithep', password: 'Admin@1234' },
    });
    const oldLoginRes = await loginPOST(oldLoginReq);
    expect(oldLoginRes.status).toBe(401);
  });

  it('7.4 should allow superadmin to create and delete a new admin account', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    // 1. Create new admin
    const createReq = await makeRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: {
        username: 'somchai',
        displayName: 'สมชาย ใจดี',
        password: 'Somchai@Password1',
      },
      token: superadminToken,
    });
    const createRes = await usersPOST(createReq);
    expect(createRes.status).toBe(201);
    const createData: any = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.user.username).toBe('somchai');

    const createdId = createData.user.id;

    // 2. Try duplicate username -> 409
    const dupReq = await makeRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: {
        username: 'somchai',
        displayName: 'สมชาย ซ้ำ',
        password: 'AnotherPassword@1',
      },
      token: superadminToken,
    });
    const dupRes = await usersPOST(dupReq);
    expect(dupRes.status).toBe(409);

    // 3. Delete the newly created admin
    const deleteReq = await makeRequest(`http://localhost:3000/api/admin/users/${createdId}`, {
      method: 'DELETE',
      token: superadminToken,
    });
    const deleteRes = await userDELETE(deleteReq, { params: Promise.resolve({ id: createdId }) });
    expect(deleteRes.status).toBe(200);

    // 4. Verify login fails for deleted admin
    const deletedLoginReq = await makeRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: { username: 'somchai', password: 'Somchai@Password1' },
    });
    const deletedLoginRes = await loginPOST(deletedLoginReq);
    expect(deletedLoginRes.status).toBe(401);
  });

  it('7.5 should prevent deletion of self or primary superadmin', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    // 1. Delete self -> 400
    const delSelfReq = await makeRequest('http://localhost:3000/api/admin/users/admin_chookait', {
      method: 'DELETE',
      token: superadminToken,
    });
    const delSelfRes = await userDELETE(delSelfReq, { params: Promise.resolve({ id: 'admin_chookait' }) });
    expect(delSelfRes.status).toBe(400);
    const delSelfData: any = await delSelfRes.json();
    expect(delSelfData.error).toContain('ไม่สามารถลบบัญชีตนเองได้');
  });

  it('7.6 should verify updated admin names and allow superadmin to edit admin display name', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    // 1. Verify 0004 migration names in listing
    const listReq = await makeRequest('http://localhost:3000/api/admin/users', { token: superadminToken });
    const listRes = await usersGET(listReq);
    const listData: any = await listRes.json();
    const pathaithep = listData.users.find((u: any) => u.username === 'pathaithep');
    const nathlada = listData.users.find((u: any) => u.username === 'nathlada');
    expect(pathaithep.displayName).toBe('ไผทเทพ ตุทานนท์');
    expect(nathlada.displayName).toBe('นาถลดา ศรียะพันธ์');

    // 2. Superadmin updates display name of pathaithep
    const patchReq = await makeRequest('http://localhost:3000/api/admin/users/admin_pathaithep', {
      method: 'PATCH',
      body: { display_name: 'ไผทเทพ ตุทานนท์ (หัวหน้า)' },
      token: superadminToken,
    });
    const patchRes = await userPATCH(patchReq, { params: Promise.resolve({ id: 'admin_pathaithep' }) });
    expect(patchRes.status).toBe(200);
    const patchData: any = await patchRes.json();
    expect(patchData.admin.displayName).toBe('ไผทเทพ ตุทานนท์ (หัวหน้า)');

    // 3. Regular admin cannot patch display name (403)
    const normalAdminToken = await createSessionToken({
      adminId: 'admin_pathaithep',
      username: 'pathaithep',
      displayName: 'ไผทเทพ ตุทานนท์',
      role: 'admin',
    });
    const regularPatchReq = await makeRequest('http://localhost:3000/api/admin/users/admin_nathlada', {
      method: 'PATCH',
      body: { display_name: 'New Name' },
      token: normalAdminToken,
    });
    const regularPatchRes = await userPATCH(regularPatchReq, { params: Promise.resolve({ id: 'admin_nathlada' }) });
    expect(regularPatchRes.status).toBe(403);
  });

  it('7.7 should reject session tokens that have exceeded the 8-hour expiry', async () => {
    // Generate an expired token (exp in past)
    const payload = {
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
      exp: Math.floor(Date.now() / 1000) - 10, // 10 seconds ago
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode('suan-dusit-lampang-meeting-room-default-secret-key-2026'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadBase64));
    const expiredToken = `${payloadBase64}.${Buffer.from(sig).toString('base64url')}`;

    const verified = await verifySessionToken(expiredToken);
    expect(verified).toBeNull();
  });
});
