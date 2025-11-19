const apiUrl = process.env.APIFY_API_PUBLIC_BASE_URL;

const keyValueStoreId = process.env.ACTOR_DEFAULT_KEY_VALUE_STORE_ID;
export const keyValueStoreUrl = `${apiUrl}/v2/key-value-stores/${keyValueStoreId}/records`;

const datasetId = process.env.ACTOR_DEFAULT_DATASET_ID;
export const datasetUrl = `${apiUrl}/v2/datasets/${datasetId}/items`;

export const containerUrl = process.env.ACTOR_WEB_SERVER_URL;