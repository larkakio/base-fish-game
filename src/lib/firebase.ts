/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCkyHvG8mEFIE_kOPY_aQFHuE1VZTTQs8c',
  authDomain: 'fishdom-a4a18.firebaseapp.com',
  projectId: 'fishdom-a4a18',
  storageBucket: 'fishdom-a4a18.firebasestorage.app',
  messagingSenderId: '319872962082',
  appId: '1:319872962082:web:ab16370bfe114df043047b',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const SCORES_COLLECTION = 'scores';
const USERS_COLLECTION = 'users';

export interface LeaderboardEntry {
  id: string;
  walletAddress: string;
  farcasterUsername?: string;
  farcasterFid?: number;
  score: number;
  level: number;
  character?: string;
  gamesPlayed?: number;
  timestamp: Date;
}

export interface UserStats {
  walletAddress: string;
  highScore: number;
  level: number;
  gamesPlayed: number;
  totalScore: number;
  lastPlayed: Date;
  farcasterUsername?: string;
  farcasterFid?: number;
}

export interface ScoreSubmission {
  walletAddress: string;
  farcasterUsername?: string;
  farcasterFid?: number;
  score: number;
  level: number;
  character?: string;
}

/**
 * Save a new score to the leaderboard
 */
export async function saveScore(submission: ScoreSubmission): Promise<void> {
  try {
    const timestamp = Timestamp.now();

    // Add score to scores collection
    await addDoc(collection(db, SCORES_COLLECTION), {
      ...submission,
      timestamp,
      createdAt: timestamp,
    });

    // Update user stats
    await updateUserStats(submission);
  } catch (error) {
    console.error('Error saving score:', error);
    throw error;
  }
}

/**
 * Update user statistics
 */
async function updateUserStats(submission: ScoreSubmission): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, submission.walletAddress.toLowerCase());
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserStats;
    await updateDoc(userRef, {
      highScore: Math.max(userData.highScore, submission.score),
      level: Math.max(userData.level, submission.level),
      gamesPlayed: userData.gamesPlayed + 1,
      totalScore: userData.totalScore + submission.score,
      lastPlayed: Timestamp.now(),
      farcasterUsername: submission.farcasterUsername || userData.farcasterUsername,
      farcasterFid: submission.farcasterFid || userData.farcasterFid,
    });
  } else {
    await setDoc(userRef, {
      walletAddress: submission.walletAddress.toLowerCase(),
      highScore: submission.score,
      level: submission.level,
      gamesPlayed: 1,
      totalScore: submission.score,
      lastPlayed: Timestamp.now(),
      farcasterUsername: submission.farcasterUsername,
      farcasterFid: submission.farcasterFid,
      character: submission.character,
      createdAt: Timestamp.now(),
    });
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(walletAddress: string): Promise<UserStats | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        walletAddress: data.walletAddress,
        highScore: data.highScore || 0,
        level: data.level || 1,
        gamesPlayed: data.gamesPlayed || 0,
        totalScore: data.totalScore || 0,
        lastPlayed: data.lastPlayed?.toDate() || new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

/**
 * Get leaderboard entries
 */
export async function getLeaderboard(
  timeframe: 'daily' | 'weekly' | 'allTime' = 'allTime',
  limitCount: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    let q;
    const scoresRef = collection(db, USERS_COLLECTION);

    if (timeframe === 'allTime') {
      // For all-time, just get highest scores from users collection
      q = query(
        scoresRef,
        orderBy('highScore', 'desc'),
        limit(limitCount)
      );
    } else {
      // For daily/weekly, filter by timestamp
      const now = new Date();
      let startDate: Date;

      if (timeframe === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else {
        // Weekly - start of current week (Sunday)
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      }

      q = query(
        scoresRef,
        where('lastPlayed', '>=', Timestamp.fromDate(startDate)),
        orderBy('lastPlayed', 'desc'),
        orderBy('highScore', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        walletAddress: data.walletAddress,
        farcasterUsername: data.farcasterUsername,
        farcasterFid: data.farcasterFid,
        score: data.highScore || 0,
        level: data.level || 1,
        character: data.character,
        gamesPlayed: data.gamesPlayed,
        timestamp: data.lastPlayed?.toDate() || new Date(),
      });
    });

    // Sort by score for timeframe queries
    return entries.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get a user's rank on the leaderboard
 */
export async function getUserRank(walletAddress: string): Promise<number> {
  try {
    const leaderboard = await getLeaderboard('allTime', 1000);
    const index = leaderboard.findIndex(
      (entry) => entry.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    return index === -1 ? -1 : index + 1;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return -1;
  }
}

export { db };
