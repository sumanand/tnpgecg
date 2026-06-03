import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';

export const createAdminUser = async () => {
    try {
        const email = 'admin@tnp.edu';
        const password = 'Admin@123';

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save to users collection
        await set(ref(db, `users/${user.uid}`), {
            email: email,
            role: 'admin',
            name: 'Admin User',
            isAdmin: true,
            createdAt: new Date().toISOString()
        });

        // Save to admins collection
        await set(ref(db, `admins/${user.uid}`), {
            email: email,
            role: 'admin',
            name: 'Admin User',
            createdAt: new Date().toISOString()
        });

        console.log('Admin user created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        return { success: true };
    } catch (error) {
        console.error('Error creating admin:', error);
        return { success: false, error: error.message };
    }
};