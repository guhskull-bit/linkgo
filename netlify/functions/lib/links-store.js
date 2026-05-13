import { getStore } from '@netlify/blobs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const localStorePath = path.join(process.cwd(), '.netlify-local', 'links.json');
let blobStore;

function isLocalRuntime() {
  return process.env.CONTEXT === 'dev' || process.env.NETLIFY_DEV === 'true';
}

function getBlobLinkStore() {
  if (!blobStore) {
    blobStore = getStore({
      name: 'short-links',
    });
  }

  return blobStore;
}

async function readLocalStore() {
  try {
    const contents = await readFile(localStorePath, 'utf8');
    return JSON.parse(contents);
  } catch {
    return {};
  }
}

async function writeLocalStore(store) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(store, null, 2));
}

async function withBlobStore(operation) {
  try {
    return {
      ok: true,
      value: await operation(getBlobLinkStore()),
    };
  } catch (error) {
    if (!isLocalRuntime()) {
      throw error;
    }

    return {
      ok: false,
      value: undefined,
    };
  }
}

export async function getLink(slug) {
  const blobRecord = await withBlobStore((store) => store.get(slug, { type: 'json' }));

  if (blobRecord.ok && blobRecord.value) {
    return blobRecord.value;
  }

  const localStore = await readLocalStore();
  return localStore[slug] || null;
}

export async function saveLink(record) {
  const savedInBlob = await withBlobStore((store) => store.setJSON(record.slug, record));

  if (savedInBlob.ok) {
    return record;
  }

  const localStore = await readLocalStore();
  localStore[record.slug] = record;
  await writeLocalStore(localStore);

  return record;
}

export async function incrementClicks(slug) {
  const record = await getLink(slug);

  if (!record) {
    return null;
  }

  const updatedRecord = {
    ...record,
    clicks: (record.clicks || 0) + 1,
    lastClickedAt: new Date().toISOString(),
  };

  await saveLink(updatedRecord);
  return updatedRecord;
}
