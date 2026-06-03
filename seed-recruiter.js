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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Edit the email, password, and company details below:
const recruiterData = {
  email: 'recruiter@company.com', // Change this to your recruiter email
  password: 'Recruiter@123',       // Secure password
  companyName: 'Google Inc',       // Company Name
  phone: '9876543210',
  website: 'https://google.com',
  address: 'Mountain View, CA',
  industry: 'IT'
};

const seedRecruiter = async () => {
  let uid = null;
  const { email, password, companyName, phone, website, address, industry } = recruiterData;

  try {
    console.log(`Registering auth user for recruiter: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    uid = userCredential.user.uid;
    console.log(`Auth user created! UID: ${uid}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      try {
        console.log(`User already exists in Auth. Logging in to retrieve UID...`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        console.log(`Logged in successfully! UID: ${uid}`);
      } catch (loginError) {
        console.error('Login failed:', loginError.message);
        process.exit(1);
      }
    } else {
      console.error('Registration failed:', error.message);
      process.exit(1);
    }
  }

  if (uid) {
    try {
      console.log('Writing recruiter profile to /companies...');
      await set(ref(db, `companies/${uid}`), {
        name: companyName,
        email: email,
        phone: phone,
        website: website,
        address: address,
        industry: industry,
        createdAt: new Date().toISOString(),
        status: 'approved' // Automatically mark as approved so they can post jobs instantly
      });

      console.log('Writing role mapping to /users...');
      await set(ref(db, `users/${uid}`), {
        email: email,
        role: 'company',
        name: companyName,
        companyId: uid
      });

      console.log(`\n🎉 Success! Recruiter ${email} has been fully seeded and approved!`);
      process.exit(0);
    } catch (dbError) {
      console.error('Database write error:', dbError.message);
      process.exit(1);
    }
  }
};

seedRecruiter();
