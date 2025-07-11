import { create } from "zustand";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { formatAccountNumber } from "../utils";

export interface AlertSettings {
  id: string;
  "Level Account": boolean;
  "Level Ads": boolean;
  "Level Keyword": boolean;
  "Send Email Alerts": boolean;
  "Send SMS Alerts": boolean;
  "Send Weekly Summaries": boolean;
  "Severity Critical": boolean;
  "Severity Low": boolean;
  "Severity Medium": boolean;
  "Type Ad Performance": boolean;
  "Type Brand Checker": boolean;
  "Type Budget": boolean;
  "Type KPI Trends": boolean;
  "Type Keyword Performance": boolean;
  "Type Landing Page": boolean;
  "Type Optimization Score": boolean;
  "Type Policy": boolean;
  "Type Serving Ads": boolean;
}

export interface UserRow {
  id: string;
  email: string;
  Name: string;
  "User Type": string;
  "User Access": string;
}

export interface AdsAccount {
  id: string;
  name: string;
  "Selected Users"?: any[]; // Array of user references
  // Add other fields as needed
}

interface AlertSettingsState {
  alertSettings: AlertSettings | null;
  loading: boolean;
  error: string | null;
  loadedUserId: string | null;
  users: UserRow[];
  usersLoaded: boolean;
  adsAccounts: AdsAccount[];
  adsAccountsLoaded: boolean;
  fetchAlertSettings: (userId: string) => Promise<void>;
  updateAlertSettings: (
    userId: string,
    updates: Partial<AlertSettings>
  ) => Promise<void>;
  fetchUsers: (companyAdminRef: any) => Promise<void>;
  fetchAdsAccounts: (companyAdminRef: any) => Promise<void>;
}

export const useAlertSettingsStore = create<AlertSettingsState>((set, get) => ({
  alertSettings: null,
  loading: false,
  error: null,
  loadedUserId: null,
  users: [],
  usersLoaded: false,
  adsAccounts: [],
  adsAccountsLoaded: false,
  fetchAlertSettings: async (userId: string) => {
    if (get().loadedUserId === userId && get().alertSettings) return;
    set({ loading: true, error: null });
    try {
      const alertSettingsRef = collection(db, "alertSettings");
      const userRef = doc(db, "users", userId);
      const q = query(alertSettingsRef, where("User", "==", userRef));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        set({
          alertSettings: { id: docSnap.id, ...docSnap.data() } as AlertSettings,
          loading: false,
          loadedUserId: userId,
        });
      } else {
        set({ alertSettings: null, loading: false, loadedUserId: userId });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateAlertSettings: async (
    userId: string,
    updates: Partial<AlertSettings>
  ) => {
    set({ loading: true, error: null });
    try {
      const alertSettingsRef = collection(db, "alertSettings");
      const userRef = doc(db, "users", userId);
      const q = query(alertSettingsRef, where("User", "==", userRef));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        await updateDoc(docSnap.ref, updates);
        // Re-fetch after update
        await get().fetchAlertSettings(userId);
        set({ loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchUsers: async (companyAdminRef: any) => {
    if (get().usersLoaded) return;
    set({ loading: true, error: null });
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("Company Admin", "==", companyAdminRef));
      const snap = await getDocs(q);
      const users: UserRow[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        email: docSnap.data().email,
        Name: docSnap.data().Name,
        "User Type": docSnap.data()["User Type"],
        "User Access": docSnap.data()["User Access"],
        "Avatar": docSnap.data()["Avatar"],
        "Is Google Sign Up": docSnap.data()["Is Google Sign Up"],
      }));
      set({ users, usersLoaded: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchAdsAccounts: async (companyAdminRef: any) => {
    if (get().adsAccountsLoaded) return;
    set({ loading: true, error: null });
    try {
      const adsAccountsRef = collection(db, "adsAccounts");
      const q = query(
        adsAccountsRef,
        where("User", "==", companyAdminRef),
        where("Is Connected", "==", true)
      );
      const snap = await getDocs(q);
      const adsAccounts: AdsAccount[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        name:
          docSnap.data()["Account Name Editable"] ||
          docSnap.data()["Account Name Original"] ||
          formatAccountNumber(docSnap.data()["Id"]),
        "Selected Users": docSnap.data()["Selected Users"],
      }));
      set({ adsAccounts, adsAccountsLoaded: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
