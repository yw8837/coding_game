'use strict';

const required = [
  'MACOS_CERTIFICATE_P12_BASE64', 'MACOS_CERTIFICATE_PASSWORD', 'MACOS_SIGNING_IDENTITY',
  'APPLE_API_KEY_P8_BASE64', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER_ID',
];

function releaseConfig(env) {
  const missing = required.filter(key => !env[key]?.trim());
  if (missing.length) throw new Error(`Missing release secrets: ${missing.join(', ')}`);
  const identity = env.MACOS_SIGNING_IDENTITY;
  const team = /^Developer ID Application: .+ \(([A-Z0-9]{10})\)$/.exec(identity)?.[1];
  if (!team) throw new Error('A Developer ID Application identity is required; ad-hoc and App Store identities are not accepted.');
  if (!/^[A-Z0-9]{10}$/.test(env.APPLE_API_KEY_ID)) throw new Error('Invalid APPLE_API_KEY_ID format');
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(env.APPLE_API_ISSUER_ID)) {
    throw new Error('APPLE_API_ISSUER_ID must be a team API issuer UUID');
  }
  return {identity, team, keyId: env.APPLE_API_KEY_ID, issuer: env.APPLE_API_ISSUER_ID};
}

module.exports = {releaseConfig};
