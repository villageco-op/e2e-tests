import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.resolve(__dirname, '../../playwright/.auth/staging-state.json');

setup('Unlock staging environment', async ({ request }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  const response = await request.get('/api/staging-unlock', {
    headers: {
      'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN!,
    },
  });

  console.log('URL:', response.url());
  console.log('Status:', response.status());
  console.log('Headers:', await response.headers());
  console.log('Body:', await response.text());

  if (!response.ok()) {
    throw new Error(`Failed to unlock staging: ${response.status()} ${response.statusText()}`);
  }

  await request.storageState({ path: authFile });
});
