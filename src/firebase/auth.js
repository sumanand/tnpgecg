import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from './config';
import { ref, set, get, update, remove } from 'firebase/database';

export const loginUser = async (email, password, role) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verify role from database
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists() && snapshot.val().role === role) {
      // Update last login
      await update(userRef, {
        lastLogin: new Date().toISOString()
      });
      return { success: true, user, userData: snapshot.val() };
    } else {
      await signOut(auth);
      return { success: false, error: 'Invalid role access. Please check your credentials.' };
    }
  } catch (error) {
    let errorMessage = 'Login failed. ';
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage += 'User not found. Please register first.';
        break;
      case 'auth/wrong-password':
        errorMessage += 'Incorrect password.';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Too many failed attempts. Please try again later.';
        break;
      default:
        errorMessage += error.message;
    }
    return { success: false, error: errorMessage };
  }
};

export const registerStudent = async (email, password, studentData) => {
  try {
    // 1. Check if there is an existing pre-populated/imported student record matching rollNo or email
    let importedRecord = null;
    let importedKey = null;
    try {
      const studentsSnap = await get(ref(db, 'students'));
      if (studentsSnap.exists()) {
        studentsSnap.forEach((childSnap) => {
          const val = childSnap.val();
          const matchesRoll = studentData.rollNo && String(val.rollNo) === String(studentData.rollNo);
          const matchesEmail = email && String(val.email).toLowerCase() === String(email).toLowerCase();
          
          if (matchesRoll || matchesEmail) {
            importedRecord = val;
            importedKey = childSnap.key;
          }
        });
      }
    } catch (dbErr) {
      console.warn("Could not check pre-existing student profiles for merge:", dbErr.message);
    }

    // 2. Perform standard Auth user creation
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: studentData.name });

    // Send email verification
    await sendEmailVerification(user);

    // 3. Merge student data: Priority given to manual signup details, but preserve pre-populated attributes like placements or high school percentages
    const finalStudentPayload = {
      ...importedRecord,     // Contains class10, class12, registrationNo, placements, etc.
      ...studentData,        // Overwrite with signup fields (name, rollNo, branch, cgpa, phone, passingYear)
      email,
      createdAt: (importedRecord && importedRecord.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'student',
      emailVerified: false,
      profileComplete: true  // Set complete to true since they registered!
    };

    // Save student data to Realtime Database under their new Auth UID
    const studentRef = ref(db, `students/${user.uid}`);
    await set(studentRef, finalStudentPayload);

    // Add to users list for role verification
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, {
      email,
      role: 'student',
      name: studentData.name,
      createdAt: (importedRecord && importedRecord.createdAt) || new Date().toISOString(),
      uid: user.uid
    });

    // 4. Delete the temporary pre-populated database nodes if they exist under a separate key (e.g. imported_roll_220101)
    if (importedKey && importedKey !== user.uid) {
      try {
        await remove(ref(db, `students/${importedKey}`));
        await remove(ref(db, `users/${importedKey}`));
        console.log(`Successfully merged and cleaned up temporary pre-populated student record: ${importedKey}`);
      } catch (delErr) {
        console.warn("Failed to delete historic pre-populated student node:", delErr.message);
      }
    }

    return { success: true, user };
  } catch (error) {
    let errorMessage = 'Registration failed. ';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage += 'Email already registered. Please login.';
        break;
      case 'auth/weak-password':
        errorMessage += 'Password should be at least 6 characters.';
        break;
      default:
        errorMessage += error.message;
    }
    return { success: false, error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent!' };
  } catch (error) {
    let errorMessage = 'Password reset failed. ';
    if (error.code === 'auth/user-not-found') {
      errorMessage += 'No account found with this email.';
    } else {
      errorMessage += error.message;
    }
    return { success: false, error: errorMessage };
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isEmailVerified = () => {
  return auth.currentUser?.emailVerified || false;
};