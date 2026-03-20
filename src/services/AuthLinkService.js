const FUNCTIONS_BASE_URL =
  'https://us-central1-comunidade-team-hiit.cloudfunctions.net/health';

async function postJson(path, body, headers = {}) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const message = payload.message || payload.error || 'Falha na operação';
    throw new Error(message);
  }

  return payload;
}

export async function validateAccessLink({ email, token, type }) {
  return postJson('resolveEmailAccess', {
    email,
    token,
    type,
    validateOnly: true
  });
}

export async function resolveAccessLink({ email, token, type }) {
  return postJson('resolveEmailAccess', {
    email,
    token,
    type
  });
}

export async function completePasswordSetup({ email, idToken }) {
  return postJson(
    'completePasswordSetup',
    { email },
    { Authorization: `Bearer ${idToken}` }
  );
}
