import { test } from '@playwright/test';
import { legacyV2Journey } from '../../scripts/qa-legacy-v2';
test('continues schema3 with frozen v2 rules and preserves the old autosave on reload',async({page,baseURL})=>{
  await legacyV2Journey(page,baseURL!);
});
