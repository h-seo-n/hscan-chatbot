import type { AccessTokenProvider } from "../types/generalTypes";

export function createAuthenticatedFetch(
    getAccessToken: AccessTokenProvider,
): typeof fetch {
    return async (input, init = {}) => {
        const token = getAccessToken();
        const headers = new Headers(init.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
    }
}
