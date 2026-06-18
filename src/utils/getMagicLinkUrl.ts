import { expect, APIRequestContext } from '@playwright/test';

/**
 * Fetches the Magic Link token from the testing route and constructs the NextAuth login URL.
 * @param request - The Api request context
 * @param baseURL - The request base url
 * @param email - The email used for login/creation
 * @returns The complete navigation url
 */
export async function getMagicLinkUrl(
  request: APIRequestContext,
  baseURL: string = 'http://localhost:3000',
  baseURLApi: string,
  email: string
): Promise<string> {
  const tokenRes = await request.get(`${baseURLApi}/api/testing`, {
    params: { email },
  });
  console.log(`Token response: ${JSON.stringify(tokenRes)}`);
  expect(tokenRes.ok()).toBeTruthy();
  
  const tokenData = await tokenRes.json();
  expect(tokenData.token).toBeDefined();

  const callbackUrl = encodeURIComponent(`${baseURL}/login/success`);
  const encodedEmail = encodeURIComponent(email);
  
  return `${baseURL}/api/auth/callback/nodemailer?callbackUrl=${callbackUrl}&token=${tokenData.token}&email=${encodedEmail}`;
}
