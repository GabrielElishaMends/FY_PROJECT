import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export const uploadImageAsync = async (uri: string, userId: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storage = getStorage();
  const imageRef = ref(storage, `users/${userId}/images/${Date.now()}.jpg`);
  await uploadBytes(imageRef, blob);
  const downloadURL = await getDownloadURL(imageRef);
  return downloadURL;
};

export const saveFoodHistory = async ({
  userId,
  imageUri,
  foodName,
  calories,
  createdAt,
}: {
  userId: string;
  imageUri: string | number | null;
  foodName: string;
  calories: string | number;
  createdAt: string;
}) => {
  try {
    const historyData = {
      userId,
      imageUri: imageUri, // Keep the original imageUri (could be Firebase URL or local asset)
      name: foodName,
      calories: calories || '0',
      createdAt: serverTimestamp(),
    };

    // Remove null values but keep empty strings and numbers
    Object.keys(historyData).forEach((key) => {
      if (historyData[key] === null || historyData[key] === undefined) {
        delete historyData[key];
      }
    });

    console.log('💾 Saving food history with imageUri:', historyData.imageUri);
    await addDoc(collection(db, 'history'), historyData);
  } catch (error) {
    console.error('Error saving food history:', error);
    throw new Error('Failed to save food history');
  }
};

// Add this function to check Firebase data
export const logFoodHistory = async (userId: string) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'history'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    );

    querySnapshot.forEach((doc) => {
      console.log('Latest Firebase Entry:', {
        id: doc.id,
        ...doc.data(),
      });
    });
  } catch (error) {
    console.error('Error fetching food history:', error);
  }
};
