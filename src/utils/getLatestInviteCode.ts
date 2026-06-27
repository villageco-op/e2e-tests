import { APIRequestContext, expect } from "@playwright/test";

/**
 * Fetches the latest system-generated organizational invite code matching user constraints.
 * @param request - The Playwright API request context
 * @param baseURLApi - The backend testing framework location URI
 * @param email - Target invited individual's tracking email string
 * @param orgId - Unique identity key mapping to the host institution
 * @returns The active verification string token payload value
 */
export async function getLatestInviteCode(
  request: APIRequestContext,
  baseURLApi: string,
  email: string,
  orgId: string
): Promise<string> {
  const inviteRes = await request.get(`${baseURLApi}/api/testing/get-invite-code`, {
    params: { email, orgId },
  });
  expect(inviteRes.ok()).toBeTruthy();

  const body = await inviteRes.json();
  expect(body.success).toBeTruthy();
  expect(body.invite?.code).toBeDefined();

  return body.invite.code;
}
