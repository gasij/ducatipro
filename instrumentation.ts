export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const {checkDirectusHealth, getDirectusUrl, isDirectusConfigured} = await import(
      '@/src/fsd/shared/lib/directus'
    );
    if (!isDirectusConfigured()) {
      console.warn('[Directus] DIRECTUS_URL is not set — skipping health check');
      return;
    }
    console.log(`[Directus] Connecting to ${getDirectusUrl()} ...`);
    const result = await checkDirectusHealth();
    if (result.ok) {
      console.log('[Directus] Connected successfully:', JSON.stringify(result.status, null, 2));
    } else {
      console.error('[Directus] Connection failed:', result.error);
    }
  }
}
