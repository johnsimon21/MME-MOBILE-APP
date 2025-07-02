import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Hook for Firestore operations
export const useFirestore = () => {
  const { user } = useAuth();

  const getDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  };

  const setDocument = async (collectionName: string, docId: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date(),
        updatedBy: user?.uid,
      });
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  };

  const updateDocument = async (collectionName: string, docId: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
        updatedBy: user?.uid,
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  const queryDocuments = async (collectionName: string, field: string, operator: any, value: any) => {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  };

  return {
    getDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    queryDocuments,
  };
};

// Hook for Firebase Storage operations
export const useFirebaseStorage = () => {
  const uploadFile = async (file: Blob, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
  };
};

// Hook for real-time user data
export const useUserData = () => {
  const { user, firebaseUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getDocument } = useFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (firebaseUser) {
        try {
          const data: any = await getDocument('users', firebaseUser.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [firebaseUser]);

  return { userData, loading };
};