function getActionBaseUrl() {
  const configuredBase = process.env.NEXT_PUBLIC_AUTH_ACTIONS_BASE_URL?.trim();
  if (configuredBase) {
    return configuredBase.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '');
  }

  return '';
}

function normalizeUrl(path: string) {
  const baseUrl = getActionBaseUrl()
  const cleanedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanedPath}`
}

export const actionCodeSettings = {
  handleCodeInApp: true,
  url: normalizeUrl('/auth/action'),
};

export const verifyEmailActionCodeSettings = {
  handleCodeInApp: true,
  url: normalizeUrl('/auth/verify-email'),
};

export const resetPasswordActionCodeSettings = {
  handleCodeInApp: true,
  url: normalizeUrl('/auth/reset-password'),
};
