import {NextResponse} from 'next/server';

type CdekToken = {
  access_token: string;
  expires_in: number;
};

type CdekConfig = {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
};

const DEFAULT_CDEK_API_URL = 'https://api.cdek.ru/v2';

let cachedToken: {value: string; expiresAt: number} | null = null;

function getConfig(): CdekConfig | null {
  const rawClientId = process.env.CDEK_CLIENT_ID || process.env.CDEK_ACCOUNT;
  const rawClientSecret = process.env.CDEK_CLIENT_SECRET || process.env.CDEK_SECURE_PASSWORD;
  const apiUrl = process.env.CDEK_API_URL || DEFAULT_CDEK_API_URL;

  if (
    !rawClientId ||
    !rawClientSecret ||
    rawClientId.startsWith('your-') ||
    rawClientSecret.startsWith('your-')
  ) {
    return null;
  }

  return {clientId: rawClientId, clientSecret: rawClientSecret, apiUrl};
}

async function getAccessToken(config: CdekConfig) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(`${config.apiUrl}/oauth/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'CDEK token request failed: проверьте CDEK_CLIENT_ID/CDEK_CLIENT_SECRET'
        : `CDEK token request failed: ${response.status}`,
    );
  }

  const token = (await response.json()) as CdekToken;
  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + Math.max(token.expires_in - 60, 60) * 1000,
  };

  return cachedToken.value;
}

async function requestCdek(
  config: CdekConfig,
  path: string,
  init: {method?: 'GET' | 'POST'; params?: URLSearchParams; body?: unknown} = {},
) {
  const token = await getAccessToken(config);
  const url = new URL(`${config.apiUrl}${path}`);

  init.params?.forEach((value, key) => {
    if (value && value !== 'null') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    method: init.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? {'Content-Type': 'application/json'} : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`CDEK request failed: ${response.status}`);
  }

  return response.json();
}

function getOfficeParams(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const supportedParams = [
    'city_code',
    'postal_code',
    'country_code',
    'region_code',
    'type',
    'have_cashless',
    'have_cash',
    'allowed_cod',
    'is_dressing_room',
    'is_handout',
    'is_reception',
    'weight_max',
    'weight_min',
    'take_only',
  ];

  supportedParams.forEach((key) => {
    const value = searchParams.get(key);
    if (value && value !== 'ALL') {
      params.set(key, value);
    }
  });

  return params;
}

async function handleWidgetRequest(request: Request, body?: Record<string, unknown>) {
  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          'СДЭК не настроен: добавьте CDEK_CLIENT_ID и CDEK_CLIENT_SECRET в .env.local',
      },
      {status: 503},
    );
  }

  const url = new URL(request.url);
  const action = (body?.action || url.searchParams.get('action')) as string | null;

  try {
    if (action === 'offices') {
      const offices = await requestCdek(config, '/deliverypoints', {
        params: getOfficeParams(url.searchParams),
      });

      return NextResponse.json(offices);
    }

    if (action === 'calculate') {
      const {action: _action, ...payload} = body || {};
      const calculation = await requestCdek(config, '/calculator/tarifflist', {
        method: 'POST',
        body: payload,
      });

      return NextResponse.json(calculation);
    }

    return NextResponse.json({error: 'Unknown CDEK widget action'}, {status: 400});
  } catch (error) {
    console.error('CDEK widget service error:', error);
    return NextResponse.json({error: 'Не удалось получить данные СДЭК'}, {status: 502});
  }
}

export async function GET(request: Request) {
  return handleWidgetRequest(request);
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({error: 'Invalid CDEK widget body'}, {status: 400});
  }

  return handleWidgetRequest(request, body);
}
