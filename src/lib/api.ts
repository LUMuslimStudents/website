
const BACKEND = import.meta.env.VITE_BACKEND;

import { RESTRequest } from "./REST.api";
import { SupabaseRequest } from "./supabase.api";

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    let request;
    if (BACKEND === "supabase") {
        request = SupabaseRequest;
    }
    else if (BACKEND === "REST") {
        request = RESTRequest;
    }
    else {
        throw new Error("Backend is not valid. If you are an admin, please restart website with correct configuration.");
    }
    // FormData passes through as-is; both handlers detect it
    const response = await request(endpoint, method, body);

    // Ensure poster paths are absolute (leading /) or full URLs so
    // the frontend can use `${poster}/0.png` unconditionally.
    const ensureAbsolutePoster = (obj: any) => {
      if (obj?.poster && typeof obj.poster === 'string' && !obj.poster.startsWith('/') && !obj.poster.startsWith('http')) {
        obj.poster = `/${obj.poster}`;
      }
    };
    if (Array.isArray(response)) {
      response.forEach(ensureAbsolutePoster);
    } else if (response && typeof response === 'object') {
      ensureAbsolutePoster(response);
    }

    return response;
};
