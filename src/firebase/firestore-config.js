import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
