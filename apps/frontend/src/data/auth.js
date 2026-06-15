let getTokenFn = null;

export function setGetToken(fn) {
  getTokenFn = fn;
}

export async function getAuthToken() {
  if (!getTokenFn) return null;
  return getTokenFn();
}
