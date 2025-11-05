
import { openDB } from 'idb';

const DB_NAME = 'GoalAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export const get = async (key) => {
  return (await dbPromise).get(STORE_NAME, key);
};

export const set = async (key, val) => {
  return (await dbPromise).put(STORE_NAME, val, key);
};

export const del = async (key) => {
  return (await dbPromise).delete(STORE_NAME, key);
};

export const clear = async () => {
  return (await dbPromise).clear(STORE_NAME);
};
