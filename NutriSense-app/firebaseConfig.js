import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyApn0nASMqIP7jErDRt4CtGV6uLcyazSeQ',
  authDomain: 'paid-internship-with-firebase.firebaseapp.com',
  projectId: 'paid-internship-with-firebase',
  storageBucket: 'paid-internship-with-firebase.appspot.com',
  messagingSenderId: '832187298033',
  appId: '1:832187298033:web:1b84bfbf61b5ec2f167950',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth instance
const auth = getAuth(app);

const storage = getStorage(app);
const db = getFirestore(app);

export { auth, storage, db };
