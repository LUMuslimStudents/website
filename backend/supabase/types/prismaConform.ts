export const conformDates = <T extends Record<string, any>>(obj: T): T => {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            result[key] = new Date(value);
        } else if (typeof value === 'number' && key === 'id') {
            result[key] = BigInt(value);
        } else if (Array.isArray(value)) {
            result[key] = value.map((item) => (item && typeof item === 'object' ? conformDates(item as Record<string, any>) : item));
        } else if (value !== null && typeof value === 'object') {
            result[key] = conformDates(value as Record<string, any>);
        } else {
            result[key] = value;
        }
    }

    return result as T;
};