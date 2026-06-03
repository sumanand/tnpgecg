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

const adminsToCreate = [
  { email: 'gecgopalganjtpo@gmail.com', password: 'Admin@123', name: 'GEC Gopalganj TPO' },
  { email: 'sumanshk13@gmail.com', password: 'Admin@123', name: 'Suman Admin' },
  { email: 'admin@tnp.edu', password: 'Admin@123', name: 'Admin User' }
];

const seedAll = async () => {
  for (const adminData of adminsToCreate) {
    const { email, password, name } = adminData;
    let uid = null;

    try {
      console.log(`\n-------------------------------------`);
      console.log(`Processing auth user: ${email}...`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
      console.log(`Auth user created successfully with UID: ${uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
          console.log(`Auth user already exists. Logged in to retrieve UID: ${uid}`);
        } catch (loginError) {
          console.error(`Failed to login existing user ${email}:`, loginError.message);
          continue;
        }
      } else {
        console.error(`Error creating auth user ${email}:`, error.message);
        continue;
      }
    }

    if (uid) {
      try {
        console.log(`Writing to users/${uid}...`);
        await set(ref(db, `users/${uid}`), {
          email: email,
          role: 'admin',
          name: name,
          isAdmin: true,
          createdAt: new Date().toISOString(),
          uid: uid
        });

        console.log(`Writing to admins/${uid}...`);
        await set(ref(db, `admins/${uid}`), {
          email: email,
          role: 'admin',
          name: name,
          createdAt: new Date().toISOString(),
          uid: uid
        });
        
        console.log(`Successfully completed seeding for ${email}!`);
      } catch (dbError) {
        console.error(`Error writing database records for ${email}:`, dbError.message);
      }
    }
  }

  console.log(`\n-------------------------------------`);
  console.log('All seeding actions processed.');
  process.exit(0);
};

seedAll();
