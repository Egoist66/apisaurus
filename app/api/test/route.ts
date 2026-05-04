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

    // Validate URL
    let validatedUrl: string;
    try {
      validatedUrl = new URL(url).toString();
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const startTime = Date.now();

    // Build URL with query params
    let requestUrl = validatedUrl;
    if (params && params.length > 0) {
      const urlObj = new URL(requestUrl);
      params
        .filter((p: any) => p.enabled && p.key)
        .forEach((p: any) => urlObj.searchParams.append(p.key, p.value));
      requestUrl = urlObj.toString();
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
        if (typeof body === 'object' && body !== null) {
          Object.entries(body).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        }
        requestBody = formData;
      } else if (bodyType === 'x-www-form-urlencoded') {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/x-www-form-urlencoded';
        if (typeof body === 'object' && body !== null) {
          requestBody = new URLSearchParams(body as Record<string, string>).toString();
        } else {
          requestBody = body;
        }
      } else if (bodyType === 'text' || bodyType === 'xml') {
        requestBody = typeof body === 'string' ? body : String(body);
      } else {
        requestBody = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    // Remove Content-Type if body is FormData (browser will set it with boundary)
    if (requestBody instanceof FormData) {
      delete requestHeaders['Content-Type'];
    }

    const response = await fetch(requestUrl, {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: requestBody,
    });

    const duration = Date.now() - startTime;

    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Get response body
    let responseBody: string;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        responseBody = JSON.stringify(json, null, 2);
      } else {
        responseBody = await response.text();
      }
    } catch (e) {
      responseBody = '[Unable to read response body]';
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
