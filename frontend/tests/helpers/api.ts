import { vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Mock getServerSession for API route tests
 * Call this in beforeEach to set up session mocking
 */
export function setupSessionMock() {
  vi.mock('next-auth', async () => {
    const actual = await vi.importActual('next-auth');
    return {
      ...actual,
      getServerSession: vi.fn(),
    };
  });
}

/**
 * Set the mocked session for the next API call
 */
export function mockSession(session: any) {
  const mockedGetServerSession = getServerSession as any;
  mockedGetServerSession.mockResolvedValue(session);
}

/**
 * Clear the session mock (simulate unauthenticated request)
 */
export function mockNoSession() {
  const mockedGetServerSession = getServerSession as any;
  mockedGetServerSession.mockResolvedValue(null);
}

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
} = {}) {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    searchParams = {},
  } = options;

  // Build URL with search params
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(urlObj.toString(), requestInit);
}

/**
 * Parse NextResponse to get JSON body
 */
export async function getResponseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Helper to test API route with different roles
 * Returns a function that can be called with user data
 */
export function testWithRole(
  apiHandler: (req: Request) => Promise<Response>,
  options: {
    method?: string;
    url?: string;
    body?: any;
  } = {}
) {
  return async (user: { id: string; email: string; role: string; name?: string }) => {
    // Mock session with user data
    mockSession({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || `${user.email.split('@')[0]} User`,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Create request
    const request = createMockRequest(options);

    // Call API handler
    const response = await apiHandler(request);

    // Parse response
    const json = await getResponseJson(response);

    return {
      status: response.status,
      ok: response.ok,
      data: json,
      response,
    };
  };
}

/**
 * Helper to test unauthenticated API calls
 */
export async function testUnauthenticated(
  apiHandler: (req: Request) => Promise<Response>,
  options: {
    method?: string;
    url?: string;
    body?: any;
  } = {}
) {
  mockNoSession();

  const request = createMockRequest(options);
  const response = await apiHandler(request);
  const json = await getResponseJson(response);

  return {
    status: response.status,
    ok: response.ok,
    data: json,
    response,
  };
}

/**
 * Create route context for dynamic routes (e.g., /api/teams/[teamId])
 */
export function createRouteContext(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
  };
}

/**
 * Assert API response is successful
 */
export function assertSuccess(response: { status: number; ok: boolean; data: any }) {
  if (!response.ok || response.status >= 400) {
    throw new Error(
      `Expected successful response but got ${response.status}: ${JSON.stringify(response.data)}`
    );
  }
}

/**
 * Assert API response is unauthorized
 */
export function assertUnauthorized(response: { status: number; data: any }) {
  if (response.status !== 401) {
    throw new Error(
      `Expected 401 Unauthorized but got ${response.status}: ${JSON.stringify(response.data)}`
    );
  }
}

/**
 * Assert API response is forbidden
 */
export function assertForbidden(response: { status: number; data: any }) {
  if (response.status !== 403) {
    throw new Error(
      `Expected 403 Forbidden but got ${response.status}: ${JSON.stringify(response.data)}`
    );
  }
}
