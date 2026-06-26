export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const {checkDirectusHealth, directusUrl} = await import('@/src/fsd/shared/lib/directus');
    console.log(`[Directus] Connecting to ${directusUrl} ...`);
    const result = await checkDirectusHealth();
    if (result.ok) {
      console.log('[Directus] Connected successfully:', JSON.stringify(result.status, null, 2));
    } else {
      console.error('[Directus] Connection failed:', result.error);
    }
  }
}
