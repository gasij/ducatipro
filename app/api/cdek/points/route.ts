import {NextResponse} from 'next/server';

type CdekToken = {
  access_token: string;
  expires_in: number;
};

type CdekCity = {
  code: number;
  city: string;
  region?: string;
};

type CdekDeliveryPoint = {
  code: string;
  name?: string;
  type?: string;
  address_comment?: string;
  work_time?: string;
  phones?: Array<{number?: string}>;
  location?: {
    city?: string;
    address?: string;
    longitude?: number;
    latitude?: number;
  };
};

type NormalizedDeliveryPoint = {
  code: string;
  name: string;
  type: string;
  address: string;
  city: string;
  workTime: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
};

const DEFAULT_CDEK_API_URL = 'https://api.cdek.ru/v2';

let cachedToken: {value: string; expiresAt: number} | null = null;

function getConfig() {
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

async function getAccessToken(config: NonNullable<ReturnType<typeof getConfig>>) {
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

async function requestCdek<T>(
  config: NonNullable<ReturnType<typeof getConfig>>,
  path: string,
  params: Record<string, string>,
) {
  const token = await getAccessToken(config);
  const url = new URL(`${config.apiUrl}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {Authorization: `Bearer ${token}`},
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`CDEK request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizePoint(point: CdekDeliveryPoint): NormalizedDeliveryPoint {
  return {
    code: point.code,
    name: point.name || point.code,
    type: point.type || 'PVZ',
    address: point.location?.address || point.address_comment || '',
    city: point.location?.city || '',
    workTime: point.work_time || '',
    phone: point.phones?.map((phone) => phone.number).filter(Boolean).join(', ') || '',
    latitude: point.location?.latitude ?? null,
    longitude: point.location?.longitude ?? null,
  };
}

export async function GET(request: Request) {
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

  const {searchParams} = new URL(request.url);
  const city = searchParams.get('city')?.trim();

  if (!city || city.length < 2) {
    return NextResponse.json({error: 'City is required'}, {status: 400});
  }

  try {
    const cities = await requestCdek<CdekCity[]>(config, '/location/cities', {
      city,
      country_codes: 'RU',
      size: '1',
    });

    const cityCode = cities[0]?.code;
    if (!cityCode) {
      return NextResponse.json({points: []});
    }

    const points = await requestCdek<CdekDeliveryPoint[]>(config, '/deliverypoints', {
      city_code: String(cityCode),
    });

    return NextResponse.json({
      city: cities[0],
      points: points.map(normalizePoint).filter((point) => point.address),
    });
  } catch (error) {
    console.error('CDEK points error:', error);
    return NextResponse.json({error: 'Не удалось загрузить пункты СДЭК'}, {status: 502});
  }
}
