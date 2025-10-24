import { getAuth } from './auth';
import { getFirestore } from './firestore';

const auth = getAuth();
const db = getFirestore();

export { auth, db };
