import { create } from "zustand";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/constants";
import { UserDocument } from "./auth-store";

export interface AdsAccount {
  id: string;
  "Currency Symbol"?: string;
  [key: string]: any;
}

interface UserAdsAccountsState {
  userAdsAccounts: AdsAccount[];
  selectedAdsAccount: AdsAccount | null;
  loading: boolean;
  error: string | null;
  fetchUserAdsAccounts: (userDoc: UserDocument) => Promise<void>;
  setSelectedAdsAccount: (account: AdsAccount | null) => void;
  updateAdAccountCurrencySymbol: (
    accountId: string,
    symbol: string
  ) => Promise<void>;
  updateAdAccount: (accountId: string, updates: Partial<AdsAccount>) => void;
}

export const useUserAdsAccountsStore = create<UserAdsAccountsState>((set) => ({
  userAdsAccounts: [],
  selectedAdsAccount: null,
  loading: false,
  error: null,

  setSelectedAdsAccount: (account) => set((state) => {
    // Allow updates even if the ID is the same, as the account data might have changed
    // (e.g., budget values updated)
    return { selectedAdsAccount: account };
  }),

  updateAdAccountCurrencySymbol: async (accountId: string, symbol: string) => {
    try {
      const accountRef = doc(db, COLLECTIONS.ADS_ACCOUNTS, accountId);
      await updateDoc(accountRef, { "Currency Symbol": symbol });

      set((state) => {
        console.log("accountId: ", accountId);
        console.log("state.userAdsAccounts: ", state.userAdsAccounts);

        const updateUserAdsAccounts = state.userAdsAccounts.map((account) => {
          if (account.id === accountId) {
            return { ...account, "Currency Symbol": symbol };
          }
          return account;
        });

        const updatedSelectedAccount =
          state.selectedAdsAccount?.id === accountId
            ? { ...state.selectedAdsAccount, "Currency Symbol": symbol }
            : state.selectedAdsAccount;

        return {
          userAdsAccounts: updateUserAdsAccounts,
          selectedAdsAccount: updatedSelectedAccount,
        };
      });
    } catch (error: any) {
      console.error("Failed to update currency symbol in Firestore:", error);
      set({ error: error.message });
    }
  },

  fetchUserAdsAccounts: async (userDoc) => {
    set({ loading: true, error: null });
    try {
      const adsAccountRef = collection(db, COLLECTIONS.ADS_ACCOUNTS);
      const companyAdminRef = userDoc["Company Admin"];
      const userRef = doc(db, COLLECTIONS.USERS, userDoc.uid);

      const adsAccountQuery = query(
        adsAccountRef,
        where("User", "==", companyAdminRef),
        where("Is Connected", "==", true),
        where("Selected Users", "array-contains", userRef)
      );

      const adsAccountSnap = await getDocs(adsAccountQuery);
      const accounts: AdsAccount[] = adsAccountSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (accounts.length === 1) {
        set({
          userAdsAccounts: accounts,
          selectedAdsAccount: accounts[0],
          loading: false,
        });
      } else {
        set({
          userAdsAccounts: accounts,
          selectedAdsAccount: null,
          loading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateAdAccount: (accountId: string, updates: Partial<AdsAccount>) => {
    set((state) => {
      const updatedUserAdsAccounts = state.userAdsAccounts.map((account) => {
        if (account.id === accountId) {
          return { ...account, ...updates };
        }
        return account;
      });

      const updatedSelectedAccount =
        state.selectedAdsAccount?.id === accountId
          ? { ...state.selectedAdsAccount, ...updates }
          : state.selectedAdsAccount;

      return {
        userAdsAccounts: updatedUserAdsAccounts,
        selectedAdsAccount: updatedSelectedAccount,
      };
    });
  },
}));
