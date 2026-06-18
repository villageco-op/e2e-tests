import { Browser, APIRequestContext, Page } from "@playwright/test";

/**
 * Helper function to authenticate an email, set browser cookies, 
 * and return a fully setup page and context.
 */
export async function createAuthenticatedPage(
  browser: Browser,
  request: APIRequestContext,
  baseURL: string | undefined,
  baseURLApi: string,
  email: string
): Promise<{ page: Page; context: any }> {
  const loginResponse = await request.post(`${baseURLApi}/api/testing/test-login`, { data: { email } });
  
  console.log(`Login response: ${JSON.stringify(loginResponse)}`);
  const cookiesHeader = loginResponse.headers()['set-cookie'];

  const context = await browser.newContext();

  if (cookiesHeader) {
    const cookieStrings = cookiesHeader.split('\n');
    
    for (const cookieStr of cookieStrings) {
      const [nameValue] = cookieStr.split(';');
      const [name, value] = nameValue.split('=');
      
      await context.addCookies([{
        name: name.trim(),
        value: value.trim(),
        domain: new URL(baseURL!).hostname,
        path: '/',
        httpOnly: true,
        secure: !baseURL?.includes('localhost'),
        sameSite: 'Lax'
      }]);
    }
  }

  const page = await context.newPage();
  return { page, context };
}
