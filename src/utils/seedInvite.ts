import { APIRequestContext, expect } from "@playwright/test";

/**
 * Direct backdoor utility to configure an organizational invite context without breaking UI flows.
 * @returns The structured database Invite object payload containing the generated code
 */
export async function seedInvite(
  request: APIRequestContext,
  baseURLApi: string,
  payload: { email: string; orgId: string; role?: 'member' | 'admin' }
): Promise<{ id: string; email: string; orgId: string; code: string; role: string; expiresAt: string }> {
  const res = await request.post(`${baseURLApi}/api/testing/seed-invite`, {
    data: payload
  });
  expect(res.ok()).toBeTruthy();

  const body = await res.json();
  expect(body.success).toBeTruthy();
  return body.invite;
}
