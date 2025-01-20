import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from './firebase'; // Arquivo de configuração

const db = getFirestore(app);

export async function getFidelityPrograms(userId) {
    const programsRef = collection(db, 'users', userId, 'fidelityPrograms');
    const snapshot = await getDocs(programsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
