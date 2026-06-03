import { readFileSync } from 'fs';
import { join } from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

// Helper to load .env variables
const loadEnv = () => {
  try {
    const envPath = join(process.cwd(), '.env');
    const envFile = readFileSync(envPath, 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        env[key] = value;
      }
    });
    return env;
  } catch (error) {
    console.error('Failed to read .env file:', error);
    process.exit(1);
  }
};

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const seedAdmin = async () => {
  const email = 'admin@tnp.edu';
  const password = 'Admin@123';
  let uid = null;

  try {
    console.log(`Creating auth user: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    uid = userCredential.user.uid;
    console.log(`Auth user created successfully with UID: ${uid}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`User already exists in Auth. Logging in to retrieve UID...`);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        console.log(`Log in successful. Retrieved UID: ${uid}`);
      } catch (loginError) {
        console.error('Failed to login existing user:', loginError);
        process.exit(1);
      }
    } else {
      console.error('Error creating auth user:', error);
      process.exit(1);
    }
  }

  if (uid) {
    try {
      console.log('Step 1: Writing to users/ collection...');
      // Save to users collection first
      await set(ref(db, `users/${uid}`), {
        email: email,
        role: 'admin',
        name: 'Admin User',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        uid: uid
      });
      console.log('Step 1: Successful!');

      console.log('Step 2: Writing to admins/ collection...');
      try {
        // Save to admins collection
        await set(ref(db, `admins/${uid}`), {
          email: email,
          role: 'admin',
          name: 'Admin User',
          createdAt: new Date().toISOString(),
          uid: uid
        });
        console.log('Step 2: Successful!');
      } catch (adminError) {
        console.warn('Step 2 Warning: Could not write to /admins (this is common due to database security rules, but your login will still work):', adminError.message);
      }

      console.log('Seeding process finished!');
      process.exit(0);
    } catch (dbError) {
      console.error('Error writing main user record to database:', dbError);
      process.exit(1);
    }
  }
};

seedAdmin();
