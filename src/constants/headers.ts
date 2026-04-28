import type { HeaderAuditResult, HeaderRule } from '@/types';

export const HEADER_RULES: HeaderRule[] = [
  {
    name: 'content-security-policy',
    displayName: 'Content-Security-Policy',
    description: 'Controls which resources the browser is allowed to load.',
    weight: 20,
    evaluate(value) {
      const base = {
        headerName: 'content-security-policy',
        displayName: 'Content-Security-Policy',
        value,
        weight: 20,
      };
      if (!value) {
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header is not set.',
          recommendation:
            "Add a Content-Security-Policy header. Start with: default-src 'self'; script-src 'self'",
        };
      }
      const hasUnsafeInline = value.includes("'unsafe-inline'");
      const hasUnsafeEval = value.includes("'unsafe-eval'");
      if (hasUnsafeInline && hasUnsafeEval) {
        return {
          ...base,
          status: 'fail',
          score: 0,
          message: "Contains both 'unsafe-inline' and 'unsafe-eval' — CSP is largely ineffective.",
          recommendation:
            "Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts.",
        };
      }
      if (hasUnsafeInline || hasUnsafeEval) {
        return {
          ...base,
          status: 'warn',
          score: 10,
          message: `Contains ${hasUnsafeInline ? "'unsafe-inline'" : "'unsafe-eval'"} which weakens the policy.`,
          recommendation: 'Replace unsafe directives with nonces or hashes for inline content.',
        };
      }
      return {
        ...base,
        status: 'pass',
        score: 20,
        message: 'CSP is set with no unsafe directives detected.',
        recommendation: '',
      };
    },
  },
  {
    name: 'strict-transport-security',
    displayName: 'Strict-Transport-Security',
    description: 'Forces HTTPS connections and prevents downgrade attacks.',
    weight: 15,
    evaluate(value) {
      const base = {
        headerName: 'strict-transport-security',
        displayName: 'Strict-Transport-Security',
        value,
        weight: 15,
      };
      if (!value) {
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'HSTS is not set.',
          recommendation:
            'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        };
      }
      const maxAgeMatch = value.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const includesSubDomains = /includeSubDomains/i.test(value);
      if (maxAge >= 31536000 && includesSubDomains) {
        return {
          ...base,
          status: 'pass',
          score: 15,
          message: 'HSTS is properly configured.',
          recommendation: '',
        };
      }
      if (maxAge > 0) {
        return {
          ...base,
          status: 'warn',
          score: 8,
          message: `max-age is ${maxAge < 31536000 ? 'below 1 year' : 'set'}${!includesSubDomains ? ', includeSubDomains is missing' : ''}.`,
          recommendation: 'Set max-age to at least 31536000 and include includeSubDomains.',
        };
      }
      return {
        ...base,
        status: 'fail',
        score: 0,
        message: 'HSTS header is malformed.',
        recommendation: 'Check header syntax.',
      };
    },
  },
  {
    name: 'x-content-type-options',
    displayName: 'X-Content-Type-Options',
    description: 'Prevents MIME-type sniffing attacks.',
    weight: 10,
    evaluate(value) {
      const base = {
        headerName: 'x-content-type-options',
        displayName: 'X-Content-Type-Options',
        value,
        weight: 10,
      };
      if (!value)
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: 'Add: X-Content-Type-Options: nosniff',
        };
      if (value.trim().toLowerCase() === 'nosniff')
        return {
          ...base,
          status: 'pass',
          score: 10,
          message: 'Correctly set to nosniff.',
          recommendation: '',
        };
      return {
        ...base,
        status: 'warn',
        score: 5,
        message: `Unexpected value: "${value}".`,
        recommendation: 'Value must be exactly "nosniff".',
      };
    },
  },
  {
    name: 'x-frame-options',
    displayName: 'X-Frame-Options',
    description: 'Prevents clickjacking by controlling iframe embedding.',
    weight: 10,
    evaluate(value, _allHeaders?: Record<string, string>) {
      const base = {
        headerName: 'x-frame-options',
        displayName: 'X-Frame-Options',
        value,
        weight: 10,
      };
      const csp = _allHeaders?.['content-security-policy'] ?? '';
      const hasFrameAncestors = /frame-ancestors\s/.test(csp);
      if (!value) {
        if (hasFrameAncestors) {
          return {
            ...base,
            status: 'pass',
            score: 10,
            message: 'Header not set, but CSP frame-ancestors is present.',
            recommendation: '',
          };
        }
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: "Add: X-Frame-Options: DENY or use CSP frame-ancestors 'none'",
        };
      }
      const v = value.trim().toUpperCase();
      if (v === 'DENY' || v === 'SAMEORIGIN')
        return {
          ...base,
          status: 'pass',
          score: 10,
          message: `Correctly set to ${v}.`,
          recommendation: '',
        };
      if (v.startsWith('ALLOW-FROM'))
        return {
          ...base,
          status: 'warn',
          score: 5,
          message: 'ALLOW-FROM is deprecated and not supported in all browsers.',
          recommendation: 'Use CSP frame-ancestors directive instead.',
        };
      return {
        ...base,
        status: 'warn',
        score: 5,
        message: `Unrecognised value: "${value}".`,
        recommendation: 'Use DENY or SAMEORIGIN.',
      };
    },
  },
  {
    name: 'referrer-policy',
    displayName: 'Referrer-Policy',
    description: 'Controls how much referrer information is sent with requests.',
    weight: 10,
    evaluate(value) {
      const base = {
        headerName: 'referrer-policy',
        displayName: 'Referrer-Policy',
        value,
        weight: 10,
      };
      const SAFE = ['no-referrer', 'strict-origin', 'strict-origin-when-cross-origin'];
      const WARN = ['same-origin', 'origin', 'no-referrer-when-downgrade'];
      if (!value)
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        };
      if (SAFE.includes(value.toLowerCase()))
        return {
          ...base,
          status: 'pass',
          score: 10,
          message: 'Referrer policy is set to a safe value.',
          recommendation: '',
        };
      if (WARN.includes(value.toLowerCase()))
        return {
          ...base,
          status: 'warn',
          score: 5,
          message: `"${value}" may leak origin information.`,
          recommendation: 'Use strict-origin-when-cross-origin or stricter.',
        };
      if (value.toLowerCase() === 'unsafe-url')
        return {
          ...base,
          status: 'fail',
          score: 0,
          message: 'unsafe-url sends full URL in referrer header — high information leakage risk.',
          recommendation: 'Change to strict-origin-when-cross-origin.',
        };
      return {
        ...base,
        status: 'warn',
        score: 5,
        message: `Unrecognised value: "${value}".`,
        recommendation: 'Use strict-origin-when-cross-origin.',
      };
    },
  },
  {
    name: 'permissions-policy',
    displayName: 'Permissions-Policy',
    description: 'Controls access to browser features like camera, microphone, geolocation.',
    weight: 10,
    evaluate(value) {
      const base = {
        headerName: 'permissions-policy',
        displayName: 'Permissions-Policy',
        value,
        weight: 10,
      };
      if (!value)
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()',
        };
      const directives = value
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      if (directives.length >= 3)
        return {
          ...base,
          status: 'pass',
          score: 10,
          message: `${directives.length} feature directives configured.`,
          recommendation: '',
        };
      return {
        ...base,
        status: 'warn',
        score: 5,
        message: `Only ${directives.length} directive(s) set — consider restricting more features.`,
        recommendation: 'Add restrictions for camera, microphone, geolocation, payment, usb.',
      };
    },
  },
  {
    name: 'cross-origin-opener-policy',
    displayName: 'Cross-Origin-Opener-Policy',
    description: 'Isolates the browsing context to prevent cross-origin attacks.',
    weight: 10,
    evaluate(value) {
      const base = {
        headerName: 'cross-origin-opener-policy',
        displayName: 'Cross-Origin-Opener-Policy',
        value,
        weight: 10,
      };
      if (!value)
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: 'Add: Cross-Origin-Opener-Policy: same-origin',
        };
      if (value.toLowerCase() === 'same-origin')
        return {
          ...base,
          status: 'pass',
          score: 10,
          message: 'Correctly set to same-origin.',
          recommendation: '',
        };
      if (value.toLowerCase() === 'same-origin-allow-popups')
        return {
          ...base,
          status: 'warn',
          score: 5,
          message: 'same-origin-allow-popups provides weaker isolation.',
          recommendation: 'Prefer same-origin unless popups to other origins are required.',
        };
      return {
        ...base,
        status: 'pass',
        score: 8,
        message: `Set to "${value}".`,
        recommendation: '',
      };
    },
  },
  {
    name: 'cross-origin-embedder-policy',
    displayName: 'Cross-Origin-Embedder-Policy',
    description: 'Required for SharedArrayBuffer and cross-origin isolation.',
    weight: 10,
    evaluate(value) {
      const base = {
        headerName: 'cross-origin-embedder-policy',
        displayName: 'Cross-Origin-Embedder-Policy',
        value,
        weight: 10,
      };
      if (!value)
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: 'Add: Cross-Origin-Embedder-Policy: require-corp',
        };
      if (value.toLowerCase() === 'require-corp')
        return {
          ...base,
          status: 'pass',
          score: 10,
          message: 'Correctly set to require-corp.',
          recommendation: '',
        };
      return {
        ...base,
        status: 'warn',
        score: 5,
        message: `Set to "${value}" — require-corp is preferred.`,
        recommendation: 'Use require-corp for full cross-origin isolation.',
      };
    },
  },
  {
    name: 'cross-origin-resource-policy',
    displayName: 'Cross-Origin-Resource-Policy',
    description: 'Controls which origins can load this resource.',
    weight: 5,
    evaluate(value) {
      const base = {
        headerName: 'cross-origin-resource-policy',
        displayName: 'Cross-Origin-Resource-Policy',
        value,
        weight: 5,
      };
      if (!value)
        return {
          ...base,
          status: 'missing',
          score: 0,
          message: 'Header not set.',
          recommendation: 'Add: Cross-Origin-Resource-Policy: same-origin',
        };
      const v = value.toLowerCase();
      if (v === 'same-origin' || v === 'same-site')
        return {
          ...base,
          status: 'pass',
          score: 5,
          message: `Correctly set to ${value}.`,
          recommendation: '',
        };
      if (v === 'cross-origin')
        return {
          ...base,
          status: 'warn',
          score: 2,
          message: 'cross-origin allows any site to load this resource.',
          recommendation: 'Use same-origin unless cross-origin access is required.',
        };
      return {
        ...base,
        status: 'warn',
        score: 2,
        message: `Unrecognised value: "${value}".`,
        recommendation: 'Use same-origin or same-site.',
      };
    },
  },
];

export function applyCspReportOnlyOverride(
  results: HeaderAuditResult[],
  rawHeaders: Record<string, string>
): HeaderAuditResult[] {
  const hasEnforcedCsp = !!rawHeaders['content-security-policy'];
  const hasReportOnly = !!rawHeaders['content-security-policy-report-only'];

  if (hasReportOnly && !hasEnforcedCsp) {
    return results.map((r) => {
      if (r.headerName === 'content-security-policy') {
        return {
          ...r,
          status: 'warn' as const,
          score: r.weight * 0.5,
          value: rawHeaders['content-security-policy-report-only'],
          message: 'Only CSP-Report-Only is set — policy is not enforced.',
          recommendation: 'Add an enforced Content-Security-Policy header alongside Report-Only.',
        };
      }
      return r;
    });
  }
  return results;
}

export const SENSITIVE_CLAIMS = [
  'sub',
  'email',
  'name',
  'phone_number',
  'roles',
  'role',
  'permissions',
  'scope',
  'groups',
  'org',
  'tenant',
  'admin',
  'is_admin',
  'user_id',
  'uid',
];
