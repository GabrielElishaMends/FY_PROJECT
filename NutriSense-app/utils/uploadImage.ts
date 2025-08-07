import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImage = async (uri: string, userId: string) => {
  if (!uri) return null;
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `profileImages/${userId}.jpg`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Image upload error:', error);
    return null;
  }
};
