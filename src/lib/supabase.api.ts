import { supabaseClient } from "]/supabase";

export const getSupabaseData = async (endpoint: string, method: string = 'GET', body?: any) => {
    if (endpoint === "/current-events") {
        const resp = await supabaseClient.from('test').select('*');
        if (!resp.success) {
            throw new Error("Upstream DB error");
        }
        return resp.data;
    }
    throw new Error('API request invalid');
}