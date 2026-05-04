import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { method, url, headers, params, body, bodyType } = await req.json();

    if (!method || !url) {
      return NextResponse.json({ error: 'Method and URL are required' }, { status: 400 });
    }

    const startTime = Date.now();

    // Build URL with query params
    let requestUrl = url;
    if (params && params.length > 0) {
      const searchParams = new URLSearchParams();
      params
        .filter((p: any) => p.enabled && p.key)
        .forEach((p: any) => searchParams.append(p.key, p.value));
      const queryString = searchParams.toString();
      if (queryString) {
        requestUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {};
    if (headers && headers.length > 0) {
      headers
        .filter((h: any) => h.enabled && h.key)
        .forEach((h: any) => {
          requestHeaders[h.key] = h.value;
        });
    }

    // Prepare body
    let requestBody: BodyInit | undefined;
    if (body && bodyType !== 'none') {
      if (bodyType === 'json') {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
        requestBody = typeof body === 'string' ? body : JSON.stringify(body);
      } else if (bodyType === 'form-data') {
        const formData = new FormData();
        if (typeof body === 'object') {
          Object.entries(body).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        }
        requestBody = formData;
      } else if (bodyType === 'x-www-form-urlencoded') {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/x-www-form-urlencoded';
        if (typeof body === 'object') {
          requestBody = new URLSearchParams(body).toString();
        } else {
          requestBody = body;
        }
      } else {
        requestBody = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    const response = await fetch(requestUrl, {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: requestBody,
    });

    const duration = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody = '';
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.text();
    } else {
      responseBody = await response.text();
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 0,
      statusText: 'Error',
      headers: {},
      body: '',
      duration: 0,
      timestamp: new Date().toISOString(),
      error: error.message || 'Failed to send request',
    });
  }
}
