
const BACKEND = import.meta.env.VITE_BACKEND;

import { getRestData } from "./REST.api";
import { getSupabaseData } from "./supabase.api";

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    let getData;
    if (BACKEND === "supabase") {
        getData = getSupabaseData;
    }
    else if (BACKEND === "REST") {
        getData = getRestData;
    }
    else {
        throw new Error("Backend is not valid. If you are an admin, please restart website with correct configuration.");
    }
    const response = await getData(endpoint, method, body);
    return response;
};
