import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics for campus login spike test
const errorRate = new Rate('error_rate');
const rateLimitHits = new Counter('rate_limit_429_hits');

export const options = {
  scenarios: {
    campus_morning_rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 50 },    // 9:00 AM class begins - rapid influx
        { duration: '10s', target: 150 },  // Peak campus Wi-Fi login rush
        { duration: '10s', target: 200 },  // Sustained peak load from single IP
        { duration: '5s', target: 0 },     // Students logged in and reading
      ],
      gracefulRampDown: '3s',
    },
  },
  thresholds: {
    // Zero 429 rate limit errors (generous rate limit handles campus Wi-Fi NAT)
    'rate_limit_429_hits': ['count<1'],
    // 99%+ of all requests must succeed
    'error_rate': ['rate<0.01'],
    // 95% of requests respond under 800ms even under campus surge
    'http_req_duration': ['p(95)<800'],
  },
};

const SUPABASE_URL = 'https://hmhbbwldajchdxjeidni.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GFEY681c9Hx_MCG0vmw6CA_Mm2fPxhg';

// Campus egress IP - all students appear from this same NAT gateway IP
const CAMPUS_NAT_IP = '198.51.100.42';

export default function () {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'X-Forwarded-For': CAMPUS_NAT_IP,
    'Client-IP': CAMPUS_NAT_IP,
    'User-Agent': `CampusStudentDevice/1.0 (VU-${__VU})`,
  };

  // Step 1: Student authenticates institution license (e.g. Green Valley College: GVC-1042)
  const loginRes = http.get(
    `${SUPABASE_URL}/rest/v1/licenses?id=eq.GVC-1042&select=id,name,seats,enddate,type`,
    { headers }
  );

  if (loginRes.status === 429) {
    rateLimitHits.add(1);
  }

  const loginSuccess = check(loginRes, {
    'login status is 200 OK': (r) => r.status === 200,
    'not throttled by rate limit (no 429)': (r) => r.status !== 429,
    'license payload returned': (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!loginSuccess);

  // Small natural reading jitter before telemetry heartbeat
  sleep(0.3 + Math.random() * 0.7);

  // Step 2: Student starts secure reader session (telemetry with no seat limit cap)
  const sessionId = `k6_vu_${__VU}_${Date.now()}`;
  const sessionPayload = JSON.stringify({
    id: sessionId,
    license_id: 'GVC-1042',
    book_id: 'b1',
    last_active: new Date().toISOString(),
  });

  const sessionRes = http.post(
    `${SUPABASE_URL}/rest/v1/reading_sessions`,
    sessionPayload,
    {
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates',
      },
    }
  );

  if (sessionRes.status === 429) {
    rateLimitHits.add(1);
  }

  const sessionSuccess = check(sessionRes, {
    'session upsert is 201 or 200': (r) => r.status === 201 || r.status === 200 || r.status === 204,
    'session not rate limited': (r) => r.status !== 429,
  });

  errorRate.add(!sessionSuccess);

  // Clean up test session at end of iteration to keep database pristine
  http.del(
    `${SUPABASE_URL}/rest/v1/reading_sessions?id=eq.${sessionId}`,
    null,
    { headers }
  );

  sleep(0.5);
}
