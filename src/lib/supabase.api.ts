import { supabaseClient } from "]/supabase";

export const getSupabaseData = async (endpoint: string, method: string = 'GET', body?: any) => {
    console.log(endpoint);
    if (endpoint === "/events/current-events") {
        const resp = await supabaseClient.from('events_info').select('*');
        if (!resp.success) {
            throw new Error("Upstream DB error");
        }
        return resp.data;
    }
    throw new Error('API request invalid');
}