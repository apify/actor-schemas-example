const keyValueStoreId = process.env.ACTOR_DEFAULT_KEY_VALUE_STORE_ID;
export const keyValueStoreUrl = `https://api.apify.com/v2/key-value-stores/${keyValueStoreId}/records`;

const datasetId = process.env.ACTOR_DEFAULT_DATASET_ID;
export const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items`;