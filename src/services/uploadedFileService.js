import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseStorage } from '../firebase.js';

function getStorageReference(id) {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage sozlanmagan. .env.local faylini tekshiring.');
  }
  return ref(firebaseStorage, `uploads/${id}`);
}

function createFileId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveUploadedFile(file) {
  if (!(file instanceof Blob)) {
    throw new TypeError('Yuklanadigan fayl tanlanmagan.');
  }

  const id = createFileId();
  const fileReference = getStorageReference(id);
  try {
    await uploadBytes(fileReference, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: { originalName: file.name || 'material' },
    });
    return id;
  } catch (error) {
    throw new Error(
      `Faylni Firebase Storage’ga yuklab bo‘lmadi: ${error instanceof Error ? error.message : 'noma’lum xato.'}`,
      { cause: error },
    );
  }
}

export async function getUploadedFile(id) {
  try {
    const fileReference = getStorageReference(id);
    return { url: await getDownloadURL(fileReference) };
  } catch (error) {
    throw new Error(
      `Yuklangan faylni Firebase Storage’dan ochib bo‘lmadi: ${error instanceof Error ? error.message : 'noma’lum xato.'}`,
      { cause: error },
    );
  }
}

export async function deleteUploadedFile(id) {
  if (!id) {
    return;
  }

  try {
    await deleteObject(getStorageReference(id));
  } catch (error) {
    throw new Error(
      `Faylni Firebase Storage’dan o‘chirib bo‘lmadi: ${error instanceof Error ? error.message : 'noma’lum xato.'}`,
      { cause: error },
    );
  }
}
