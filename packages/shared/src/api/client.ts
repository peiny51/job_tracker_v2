let apiBaseUrl = "";


/**
 * Configure the backend URL once when an app starts.
 *
 * The shared package should not know whether it is running in Vite
 * or Expo. Web and mobile provide their own environment-specific URL.
 */
export function configureApi(baseUrl: string) {
  // Remove a trailing slash so endpoint paths do not become "//api/...".
  apiBaseUrl = baseUrl.replace(/\/$/, "");
}


export function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error(
      "API is not configured. Call configureApi() before using API functions."
    );
  }

  return apiBaseUrl;
}