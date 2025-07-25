import { create } from "zustand";
import { db, storage } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { User } from "firebase/auth";
import { formatAccountNumber } from "../utils";
import { APPLICATION_NAME } from "../constants";
import { CardElement } from '@stripe/react-stripe-js';

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
  "Account Name Editable"?: string;
  "Account Name Original"?: string;
  "Id"?: string;
  "Is Connected"?: boolean;
  "Is Selected"?: boolean;
  "Created Date"?: any;
  "Platform"?: string;
  "Monthly Budget"?: number;
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
  adsAccountsForTab: AdsAccount[];
  adsAccountsForTabLoaded: boolean;
  fetchAlertSettings: (userId: string) => Promise<void>;
  updateAlertSettings: (
    userId: string,
    updates: Partial<AlertSettings>
  ) => Promise<void>;
  fetchUsers: (companyAdminRef: any) => Promise<void>;
  fetchAdsAccounts: (companyAdminRef: any) => Promise<void>;
  fetchAdsAccountsForAdsAccountsTab: (
    companyAdminRef: any,
    currentUserId: string
  ) => Promise<void>;
  refreshAdsAccountsForTab: (
    companyAdminRef: any,
    currentUserId: string
  ) => Promise<void>;
  refreshUsers: (companyAdminRef: any) => Promise<void>;
  refreshAdsAccounts: (companyAdminRef: any) => Promise<void>;
  updateUser: (
    userId: string,
    updates: {
      Name?: string;
      "User Type"?: string;
      avatarFile?: File | null;
      currentAvatarUrl?: string | null;
    },
    notifyUser?: boolean,
    currentUserDoc?: any,
    selectedAds?: string[]
  ) => Promise<void>;
  updateAdsAccountsSelectedUsers: (
    userId: string,
    userType: string,
    selectedAds: string[]
  ) => Promise<void>;
  sendUserUpdateNotification: (
    toEmail: string,
    toName: string,
    userName: string,
    updaterUserType: string,
    updaterUserName: string
  ) => Promise<void>;
  inviteUser: (
    email: string,
    userType: string,
    name: string,
    selectedAds: string[]
  ) => Promise<string>;
  sendInvitationEmail: (email: string, invitationId: string) => Promise<void>;
  updateAdsAccount: (accountId: string, updates: any) => Promise<void>;
  toggleAdsAccountAlert: (
    accountId: string,
    sendAlert: boolean
  ) => Promise<void>;
  deleteAdsAccount: (accountId: string) => Promise<void>;
  updateAdsAccountVariablesBudgets: (
    accountId: string,
    monthly: number,
    daily: number
  ) => Promise<void>;
  updateMyProfile: (
    userId: string,
    {
      Name,
      Email,
      optInForTextMessage,
      Telephone,
      TelephoneDialCode,
      avatarFile,
      currentAvatarUrl,
      ...updates
    }: {
      Name: string;
      Email: string;
      optInForTextMessage: boolean;
      Telephone: string;
      TelephoneDialCode: string;
      avatarFile?: File | null;
      currentAvatarUrl?: string | null;
      [key: string]: any;
    }
  ) => Promise<void>;
  deleteCompanyAccount: (companyAdminRef: any, userLogout: () => Promise<void>) => Promise<void>;
  stripeCompany: any | null;
  stripeCompanyLoaded: boolean;
  fetchStripeCompany: (userId: string) => Promise<void>;
  updateStripeCompany: (userId: string, updates: any) => Promise<void>;
  subscription: any | null;
  subscriptionLoaded: boolean;
  fetchSubscription: (companyAdminRef: any) => Promise<void>;
  paymentMethods: any | null;
  paymentMethodsLoaded: boolean;
  fetchPaymentMethod: (companyAdminRef: any) => Promise<void>;
  fetchPaymentMethodByUser: (userRef: any) => Promise<void>;
  invoices: any[] | null;
  handleSubscriptionPayment: (
    {
      formData,
      stripe,
      elements,
      toast,
      onBack,
    }: {
      formData: any;
      stripe: any;
      elements: any;
      toast: any;
      onBack: () => void;
    }
  ) => Promise<void>;
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
  adsAccountsForTab: [],
  adsAccountsForTabLoaded: false,
  stripeCompany: null,
  stripeCompanyLoaded: false,
  subscription: null,
  subscriptionLoaded: false,
  paymentMethods: null,
  paymentMethodsLoaded: false,
  invoices: null,
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
  refreshUsers: async (companyAdminRef: any) => {
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
  refreshAdsAccounts: async (companyAdminRef: any) => {
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
  fetchAdsAccountsForAdsAccountsTab: async (
    companyAdminRef: any,
    currentUserId: string
  ) => {
    if (get().adsAccountsForTabLoaded) return;
    set({ loading: true, error: null });
    try {
      const adsAccountsRef = collection(db, "adsAccounts");
      // const currentUserRef = doc(db, "users", currentUserId);
      
      const q = query(
        adsAccountsRef,
        where("User", "==", companyAdminRef),
        where("Is Selected", "==", true)
      );
      const snap = await getDocs(q);
      
      const adsAccounts: AdsAccount[] = snap.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const selectedUsers = data["Selected Users"] || [];
          const hasUserAccess = selectedUsers.some(
            (userRef: any) =>
              userRef.id === currentUserId ||
              userRef.path?.includes(currentUserId)
          );
          
          if (!hasUserAccess) return null;
          
          return {
            id: docSnap.id,
            name:
              data["Account Name Editable"] ||
                  data["Account Name Original"] || 
                  formatAccountNumber(data["Id"]),
            "Account Name Editable": data["Account Name Editable"],
            "Account Name Original": data["Account Name Original"],
            "Id": data["Id"],
            "Is Connected": data["Is Connected"],
            "Is Selected": data["Is Selected"],
            "Created Date": data["Created Date"],
            "Platform": data["Platform"] || "Google",
            "Monthly Budget": data["Monthly Budget"] || 0,
            "Selected Users": selectedUsers,
            "Send Me Alert": data["Send Me Alert"] || false,
          };
        })
        .filter(Boolean) as AdsAccount[];
      
      set({
        adsAccountsForTab: adsAccounts,
        adsAccountsForTabLoaded: true,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateAdsAccountsSelectedUsers: async (
    userId: string,
    userType: string,
    selectedAds: string[]
  ) => {
    try {
      const userRef = doc(db, "users", userId);
      const { useAuthStore } = await import("./auth-store");
      const userDoc = useAuthStore.getState().userDoc;

      if (userType === "Admin") {
        // For Admin: Add user to all ads accounts
        const adsAccountsRef = collection(db, "adsAccounts");
        const q = query(
          adsAccountsRef,
          where("User", "==", userDoc?.["Company Admin"]),
          where("Is Connected", "==", true)
        );
        const snap = await getDocs(q);

        const updatePromises = snap.docs.map(async (docSnap) => {
          const currentSelectedUsers = docSnap.data()["Selected Users"] || [];
          const userAlreadySelected = currentSelectedUsers.some(
            (user: any) => user.id === userId || user.path?.includes(userId)
          );

          if (!userAlreadySelected) {
            return updateDoc(docSnap.ref, {
              "Selected Users": [...currentSelectedUsers, userRef],
            });
          }
        });

        await Promise.all(updatePromises.filter(Boolean));
      } else if (userType === "Manager") {
        // For Manager: Add user to selected ads accounts and remove from others
        const adsAccountsRef = collection(db, "adsAccounts");
        const q = query(
          adsAccountsRef,
          where("User", "==", userDoc?.["Company Admin"]),
          where("Is Connected", "==", true)
        );
        const snap = await getDocs(q);

        const updatePromises = snap.docs.map(async (docSnap) => {
          const accountId = docSnap.id;
          const currentSelectedUsers = docSnap.data()["Selected Users"] || [];
          const userAlreadySelected = currentSelectedUsers.some(
            (user: any) => user.id === userId || user.path?.includes(userId)
          );

          if (selectedAds.includes(accountId)) {
            // Add user to selected ads accounts
            if (!userAlreadySelected) {
              return updateDoc(docSnap.ref, {
                "Selected Users": [...currentSelectedUsers, userRef],
              });
            }
          } else {
            // Remove user from non-selected ads accounts
            if (userAlreadySelected) {
              const updatedSelectedUsers = currentSelectedUsers.filter(
                (user: any) =>
                  user.id !== userId && !user.path?.includes(userId)
              );
              return updateDoc(docSnap.ref, {
                "Selected Users": updatedSelectedUsers,
              });
            }
          }
        });

        await Promise.all(updatePromises.filter(Boolean));
      }

      // Refresh ads accounts to update the state with latest data
      if (userDoc && userDoc["Company Admin"]) {
        await get().refreshAdsAccounts(userDoc["Company Admin"]);
      }
    } catch (error) {
      console.error("Error updating ads accounts selected users:", error);
      throw error;
    }
  },
  updateUser: async (
    userId: string,
    updates: {
      Name?: string;
      "User Type"?: string;
      avatarFile?: File | null;
      currentAvatarUrl?: string | null;
    },
    notifyUser?: boolean,
    currentUserDoc?: any,
    selectedAds?: string[]
  ) => {
    set({ loading: true, error: null });
    try {
      let avatarUrl = updates.currentAvatarUrl;

      // Handle avatar upload if a new file is provided
      if (updates.avatarFile) {
        // Upload new avatar
        const avatarRef = ref(
          storage,
          `avatars/${userId}/${updates.avatarFile.name}`
        );
        await uploadBytes(avatarRef, updates.avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);

        // Delete old avatar if it exists and is different from the new one
        if (
          updates.currentAvatarUrl &&
          updates.currentAvatarUrl !== avatarUrl
        ) {
          try {
            // Extract the file path from the Firebase Storage URL
            const url = new URL(updates.currentAvatarUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[1]);
              const oldAvatarRef = ref(storage, filePath);
              await deleteObject(oldAvatarRef);
            }
          } catch (error) {
            // Ignore errors when deleting old avatar (file might not exist)
            console.warn("Could not delete old avatar:", error);
          }
        }
      }

      // Update user document
      const userRef = doc(db, "users", userId);
      const updateData: any = {};

      if (updates.Name !== undefined) {
        updateData.Name = updates.Name;
      }
      if (updates["User Type"] !== undefined) {
        updateData["User Type"] = updates["User Type"];
      }
      if (avatarUrl !== undefined) {
        updateData.Avatar = avatarUrl;
      }

      await updateDoc(userRef, updateData);

      // Update ads accounts selected users based on role
      if (updates["User Type"] && selectedAds) {
        await get().updateAdsAccountsSelectedUsers(
          userId,
          updates["User Type"],
          selectedAds
        );
      }

      // Send email notification if requested
      if (notifyUser && currentUserDoc) {
        const { useAuthStore } = await import("./auth-store");
        const userDoc = useAuthStore.getState().userDoc;
        if (userDoc) {
          await get().sendUserUpdateNotification(
            currentUserDoc.email,
            currentUserDoc.Name,
            updates.Name || currentUserDoc.Name,
            userDoc["User Type"],
            userDoc.Name
          );
        }
      }

      // Refresh users list by calling fetchUsers
      // We need to get the company admin ref from the current user
      const currentUser = get().users.find((user) => user.id === userId);
      if (currentUser) {
        // Get the company admin ref from the auth store
        const { useAuthStore } = await import("./auth-store");
        const userDoc = useAuthStore.getState().userDoc;
        if (userDoc && userDoc["Company Admin"]) {
          await get().refreshUsers(userDoc["Company Admin"]);
        }
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  sendUserUpdateNotification: async (
    toEmail: string,
    toName: string,
    userName: string,
    updaterUserType: string,
    updaterUserName: string
  ) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toEmail,
          templateId:
            process.env.NEXT_PUBLIC_SENDGRID_TEMPLATE_ID_UPDATE_PROFILE,
          toName,
          tags: {
            UserName: userName,
            UpdaterUserType: updaterUserType,
            UpdaterUserName: updaterUserName,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email notification");
      }

      const result = await response.json();
      console.log("Email notification sent successfully:", result);
    } catch (error) {
      console.error("Error sending email notification:", error);
      throw error;
    }
  },
  inviteUser: async (
    email: string,
    userType: string,
    name: string,
    selectedAds: string[]
  ) => {
    try {
      console.log("inviteUser.....");
      const { useAuthStore } = await import("./auth-store");
      const userDoc = useAuthStore.getState().userDoc;
      const invitationRef = doc(collection(db, "invitations"));
      const invitationData = {
        email,
        userType,
        name,
        selectedAds,
        invitedBy: userDoc?.uid,
        invitedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "pending",
        companyAdmin: userDoc?.["Company Admin"],
      };
      await setDoc(invitationRef, invitationData);
      await get().sendInvitationEmail(email, invitationRef.id);
      return invitationRef.id;
    } catch (error) {
      console.error("Error inviting user:", error);
      throw error;
    }
  },

  sendInvitationEmail: async (email: string, invitationId: string) => {
    try {
      const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitationId}`;
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: email,
          templateId: process.env.NEXT_PUBLIC_SENDGRID_TEMPLATE_ID_INVITE_USER,
          tags: {
            ApplicationName: APPLICATION_NAME,
            Link: invitationLink,
            ExpiresIn: "7 days",
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation email");
      }
    } catch (error) {
      console.error("Error sending invitation email:", error);
      throw error;
    }
  },
  updateAdsAccount: async (accountId: string, updates: any) => {
    set({ loading: true, error: null });
    try {
      const accountRef = doc(db, "adsAccounts", accountId);
      await updateDoc(accountRef, updates);
      
      // Refresh the ads accounts for tab data
      const { useAuthStore } = await import("./auth-store");
      const userDoc = useAuthStore.getState().userDoc;
      if (userDoc && userDoc["Company Admin"] && userDoc.uid) {
        await get().refreshAdsAccountsForTab(
          userDoc["Company Admin"],
          userDoc.uid
        );
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  toggleAdsAccountAlert: async (accountId: string, sendAlert: boolean) => {
    set({ loading: true, error: null });
    try {
      const accountRef = doc(db, "adsAccounts", accountId);
      await updateDoc(accountRef, { "Send Me Alert": sendAlert });
      
      // Refresh the ads accounts for tab data
      const { useAuthStore } = await import("./auth-store");
      const userDoc = useAuthStore.getState().userDoc;
      if (userDoc && userDoc["Company Admin"] && userDoc.uid) {
        await get().refreshAdsAccountsForTab(
          userDoc["Company Admin"],
          userDoc.uid
        );
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  refreshAdsAccountsForTab: async (
    companyAdminRef: any,
    currentUserId: string
  ) => {
    set({ adsAccountsForTabLoaded: false });
    await get().fetchAdsAccountsForAdsAccountsTab(
      companyAdminRef,
      currentUserId
    );
  },
  deleteAdsAccount: async (accountId: string) => {
    set({ loading: true, error: null });
    try {
      // 1. Delete 'adsAccountVariables' where the 'Ads Account(reference)' = accountId
      const adsAccountVariablesRef = collection(db, "adsAccountVariables");
      const adsAccountRef = doc(db, "adsAccounts", accountId);
      const q = query(
        adsAccountVariablesRef,
        where("Ads Account", "==", adsAccountRef)
      );
      const snap = await getDocs(q);
      const deleteVariablePromises = snap.docs.map((docSnap) =>
        updateDoc(docSnap.ref, { deleted: true })
      );
      await Promise.all(deleteVariablePromises);

      // todo: remove cronitor monitors for ads account
      // el-tab-settings-ad-accounts-tab -> popup delete button -> every time condition

      // 2. Delete 'adsAccounts' document where id = accountId
      // (Soft delete: set a deleted flag, or hard delete: remove the document)
      // Here, we will hard delete:
      await import("firebase/firestore").then(async (firestore) => {
        await firestore.deleteDoc(adsAccountRef);
      });

      // 3. Refresh the ads accounts for tab data
      const { useAuthStore } = await import("./auth-store");
      const userDoc = useAuthStore.getState().userDoc;
      if (userDoc && userDoc["Company Admin"] && userDoc.uid) {
        await get().refreshAdsAccountsForTab(
          userDoc["Company Admin"],
          userDoc.uid
        );
      }

      // 4. Refresh ads accounts where User == Company Admin and Is Connected == true
      if (userDoc && userDoc["Company Admin"]) {
        await get().refreshAdsAccounts(userDoc["Company Admin"]);
      }

      // todo: update subscription item

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  updateAdsAccountVariablesBudgets: async (
    accountId: string,
    monthly: number,
    daily: number
  ) => {
    try {
      const adsAccountVariablesRef = collection(db, "adsAccountVariables");
      const adsAccountRef = doc(db, "adsAccounts", accountId);
      const q = query(
        adsAccountVariablesRef,
        where("Ads Account", "==", adsAccountRef)
      );
      const snap = await getDocs(q);
      const updatePromises = snap.docs.map((docSnap) =>
        updateDoc(docSnap.ref, {
          "Monthly Budget": monthly,
          "Daily Budget": daily,
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error updating adsAccountVariables budgets:", error);
      throw error;
    }
  },
  updateMyProfile: async (
    userId: string,
    {
      Name,
      Email,
      optInForTextMessage,
      Telephone,
      TelephoneDialCode,
      avatarFile,
      currentAvatarUrl,
      ...updates
    }: {
      Name: string;
      Email: string;
      optInForTextMessage: boolean;
      Telephone: string;
      TelephoneDialCode: string;
      avatarFile?: File | null;
      currentAvatarUrl?: string | null;
      [key: string]: any;
    }
  ) => {
    set({ loading: true, error: null });
    try {
      let avatarUrl = currentAvatarUrl;
      // Handle avatar upload if a new file is provided
      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/${userId}/${avatarFile.name}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);
        // Delete old avatar if it exists and is different from the new one
        if (currentAvatarUrl && currentAvatarUrl !== avatarUrl) {
          try {
            const url = new URL(currentAvatarUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[1]);
              const oldAvatarRef = ref(storage, filePath);
              await deleteObject(oldAvatarRef);
            }
          } catch (error) {
            // Ignore errors when deleting old avatar
            console.warn("Could not delete old avatar:", error);
          }
        }
      }
      // Update user document
      const userRef = doc(db, "users", userId);
      const updateData: any = {
        Name,
        Email,
        "Opt In For Text Message": optInForTextMessage,
        Telephone,
        "Telephone Dial Code": TelephoneDialCode,
      };
      if (updates["User Type"] !== undefined) {
        updateData["User Type"] = updates["User Type"];
      }
      if (avatarUrl !== undefined) {
        updateData.Avatar = avatarUrl;
      }
      await updateDoc(userRef, updateData);
      // If the updated user is the current user, update userDoc in auth-store
      try {
        const { useAuthStore } = await import("./auth-store");
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.uid === userId) {
          const userSnap = await getDocs(
            query(collection(db, "users"), where("uid", "==", userId))
          );
          if (!userSnap.empty) {
            useAuthStore
              .getState()
              .setUserDoc(
                userSnap.docs[0].data() as import("./auth-store").UserDocument
              );
          }
        }
      } catch (e) {
        /* ignore */
      }
      // If telephone is empty or optInForTextMessage is false, update alertSettings
      if (!Telephone || !optInForTextMessage) {
        const alertSettingsRef = collection(db, "alertSettings");
        const userDocRef = doc(db, "users", userId);
        const q = query(alertSettingsRef, where("User", "==", userDocRef));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const alertDoc = snap.docs[0];
          await updateDoc(alertDoc.ref, { "Send SMS Alerts": false });
        }
      }
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  deleteCompanyAccount: async (companyAdminRef: any, userLogout: () => Promise<void>) => {
    try {
      // 1. Delete 'adsAccountVariables' where 'User' == companyAdminRef
      const adsAccountVariablesRef = collection(db, "adsAccountVariables");
      let q = query(adsAccountVariablesRef, where("User", "==", companyAdminRef));
      let snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 2. Get all adsAccounts ids for this company admin
      const adsAccountsRef = collection(db, "adsAccounts");
      q = query(adsAccountsRef, where("User", "==", companyAdminRef));
      snap = await getDocs(q);
      const adsAccountIds = snap.docs.map((doc) => doc.id);
      // Remove all adsAccountVariables where 'Ads Account' in adsAccountIds
      for (const adsAccountId of adsAccountIds) {
        const adsAccountDocRef = doc(db, "adsAccounts", adsAccountId);
        const q2 = query(adsAccountVariablesRef, where("Ads Account", "==", adsAccountDocRef));
        const snap2 = await getDocs(q2);
        for (const docSnap2 of snap2.docs) {
          await deleteDoc(docSnap2.ref);
        }
      }

      // 3. Delete all 'alerts' where 'User' == companyAdminRef
      const alertsRef = collection(db, "alerts");
      q = query(alertsRef, where("User", "==", companyAdminRef));
      snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 4. Delete all 'adsAccounts' where 'User' == companyAdminRef
      snap = await getDocs(q = query(adsAccountsRef, where("User", "==", companyAdminRef)));
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 5. Get all user ids for this company admin
      const usersRef = collection(db, "users");
      q = query(usersRef, where("Company Admin", "==", companyAdminRef));
      snap = await getDocs(q);
      const userIds = snap.docs.map((doc) => doc.id);
      // Remove all alertSettings where 'User' in userIds
      const alertSettingsRef = collection(db, "alertSettings");
      for (const userId of userIds) {
        const userDocRef = doc(db, "users", userId);
        const q2 = query(alertSettingsRef, where("User", "==", userDocRef));
        const snap2 = await getDocs(q2);
        for (const docSnap2 of snap2.docs) {
          await deleteDoc(docSnap2.ref);
        }
      }

      // 6. Remove all authenticationPageTrackers where 'User' in userIds
      const authenticationPageTrackersRef = collection(db, "authenticationPageTrackers");
      for (const userId of userIds) {
        const userDocRef = doc(db, "users", userId);
        const q2 = query(authenticationPageTrackersRef, where("User", "==", userDocRef));
        const snap2 = await getDocs(q2);
        for (const docSnap2 of snap2.docs) {
          await deleteDoc(docSnap2.ref);
        }
      }

      // 7. Delete all dashboardDailies where 'User' == companyAdminRef
      const dashboardDailiesRef = collection(db, "dashboardDailies");
      q = query(dashboardDailiesRef, where("User", "==", companyAdminRef));
      snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 8. Delete all stripeCompanies where 'User' == companyAdminRef
      const stripeCompaniesRef = collection(db, "stripeCompanies");
      q = query(stripeCompaniesRef, where("User", "==", companyAdminRef));
      snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 9. Delete all subscriptions where 'User' == companyAdminRef
      const subscriptionsRef = collection(db, "subscriptions");
      q = query(subscriptionsRef, where("User", "==", companyAdminRef));
      snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 10. Remove all userTokens where 'User' in userIds
      const userTokensRef = collection(db, "userTokens");
      for (const userId of userIds) {
        const userDocRef = doc(db, "users", userId);
        const q2 = query(userTokensRef, where("User", "==", userDocRef));
        const snap2 = await getDocs(q2);
        for (const docSnap2 of snap2.docs) {
          await deleteDoc(docSnap2.ref);
        }
      }

      // 11. Store all userIds in an array (already done above)
      // 12. Remove all users where id in userIds
      for (const userId of userIds) {
        await deleteDoc(doc(db, "users", userId));
      }

      // 13. Log the user out
      await userLogout();
    } catch (error) {
      console.error("Error deleting company account:", error);
      throw error;
    }
  },
  fetchStripeCompany: async (userId: string) => {
    if (get().stripeCompanyLoaded && get().stripeCompany) return;
    set({ loading: true, error: null });
    try {
      const stripeCompaniesRef = collection(db, "stripeCompanies");
      const userRef = doc(db, "users", userId);
      const q = query(stripeCompaniesRef, where("User", "==", userRef));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        set({
          stripeCompany: { id: docSnap.id, ...docSnap.data() },
          stripeCompanyLoaded: true,
          loading: false,
        });
      } else {
        set({ stripeCompany: null, stripeCompanyLoaded: true, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateStripeCompany: async (userId: string, updates: any) => {
    set({ loading: true, error: null });
    try {
      const stripeCompaniesRef = collection(db, "stripeCompanies");
      const userRef = doc(db, "users", userId);
      const q = query(stripeCompaniesRef, where("User", "==", userRef));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        await updateDoc(docSnap.ref, updates);
        // Re-fetch after update
        await get().fetchStripeCompany(userId);
      } else {
        // Create new record if it doesn't exist
        const newDocRef = doc(stripeCompaniesRef);
        await setDoc(newDocRef, {
          User: userRef,
          ...updates,
          createdAt: serverTimestamp(),
        });
        await get().fetchStripeCompany(userId);
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  fetchSubscription: async (companyAdminRef: any) => {
    if (get().subscriptionLoaded && get().subscription) return;
    set({ loading: true, error: null });
    try {
      const subscriptionsRef = collection(db, "subscriptions");
      const q = query(subscriptionsRef, where("User", "==", companyAdminRef));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        set({
          subscription: { id: docSnap.id, ...docSnap.data() },
          subscriptionLoaded: true,
          loading: false,
        });
      } else {
        set({ subscription: null, subscriptionLoaded: true, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchPaymentMethod: async (companyAdminRef: any) => {
    if (get().paymentMethodsLoaded && get().paymentMethods) return;
    set({ loading: true, error: null });
    try {
      const paymentMethodsRef = collection(db, "paymentMethods");
      const userRef = doc(db, "users", companyAdminRef.uid);
      const q = query(paymentMethodsRef, where("User", "==", userRef));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        set({ paymentMethods: { id: docSnap.id, ...docSnap.data() }, paymentMethodsLoaded: true, loading: false });
      } else {
        set({ paymentMethods: null, paymentMethodsLoaded: true, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchPaymentMethodByUser: async (userRef: any) => {
    set({ loading: true, error: null });
    try {
      const paymentMethodsRef = collection(db, "paymentMethods");
      const q = query(paymentMethodsRef, where("User", "==", userRef));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        console.log('docSnap', docSnap.data());
        set({ paymentMethods: { id: docSnap.id, ...docSnap.data() }, loading: false });
      } else {
        set({ paymentMethods: null, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  /**
   * Handles the full payment and subscription flow for a new payment method and subscription.
   * Usage: Call from the billing page's handleSubmit, passing formData, stripe, elements, toast, and onBack.
   */
  handleSubscriptionPayment: async ({
    formData,
    stripe,
    elements,
    toast,
    onBack,
  }: {
    formData: any;
    stripe: any;
    elements: any;
    toast: any;
    onBack: () => void;
  }) => {
    set({ loading: true, error: null });
    try {
      // 1. Get userId from userDoc['Company Admin']
      const { useAuthStore } = await import("./auth-store");
      const userDoc = useAuthStore.getState().userDoc;
      if (!userDoc) throw new Error('User document not found');
      let userId = '';
      if (userDoc["Company Admin"] && typeof userDoc["Company Admin"] === 'object' && userDoc["Company Admin"].id) {
        userId = userDoc["Company Admin"].id;
      } else if (typeof userDoc["Company Admin"] === 'string') {
        const match = userDoc["Company Admin"].match(/\/users\/(.+)/);
        userId = match && match[1] ? match[1] : userDoc["Company Admin"];
      }
      console.log('userId: ', userId);
      const userRef = doc(db, "users", userId);

      // 2. Fetch user document
      const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)));
      const userData = userSnap.empty ? null : userSnap.docs[0].data();
      if (!userData) throw new Error("User document not found");

      // 3. Fetch stripeCompanies where User == userId
      const stripeCompaniesRef = collection(db, "stripeCompanies");
      const stripeCompaniesSnap = await getDocs(query(stripeCompaniesRef, where("User", "==", userRef)));
      const stripeCompanyDoc = stripeCompaniesSnap.empty ? null : stripeCompaniesSnap.docs[0];
      const stripeCompany = stripeCompanyDoc ? stripeCompanyDoc.data() : null;

      // 4. Fetch adsAccounts where User == userId and Is Connected == true
      const adsAccountsRef = collection(db, "adsAccounts");
      const adsAccountsSnap = await getDocs(query(adsAccountsRef, where("User", "==", userRef), where("Is Connected", "==", true)));
      const adsAccounts = adsAccountsSnap.docs.map(doc => doc.data());
      const adsAccountsCount = adsAccounts.length;
      console.log('adsAccountsCount: ', adsAccountsCount);

      // 5. If paymentMethods is empty:
      if (!get().paymentMethods) {
        // Create payment method with Stripe
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement('card') || elements.getElement(CardElement),
          billing_details: {
            name: formData.nameOnCard,
            address: {
              line1: formData.streetAddress,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zip,
              country: formData.country,
            },
          },
        });
        if (error) {
          toast.error(error.message || 'Payment method creation failed');
          set({ loading: false });
          return;
        }

        // Prepare customer creation payload
        let customerEmail = userData.email || userData.Email;
        let shipping = {
          name: formData.nameOnCard,
          address: {
            line1: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            postal_code: formData.zip,
            country: formData.country,
          },
        };
        if (stripeCompany) {
          customerEmail = stripeCompany.Email || customerEmail;
          shipping = {
            name: stripeCompany["Company Name"] || formData.nameOnCard,
            address: {
              line1: stripeCompany["Street Address"] || formData.streetAddress,
              city: stripeCompany["City"] || formData.city,
              state: stripeCompany["State"] || formData.state,
              postal_code: stripeCompany["Zip"] || formData.zip,
              country: stripeCompany["Country"] || formData.country,
            },
          };
        }

        // Create Stripe customer (API route should handle attaching payment method, shipping, and email)
        const { paymentService } = await import("@/services/payment");
        
        const billingDetailsPayload = {
          nameOnCard: formData.nameOnCard,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zip: formData.zip,
        };
        
        console.log('Sending billing details to API:', billingDetailsPayload);
        
        const customerResult = await paymentService.createStripeCustomer({
          userId,
          paymentMethodId: paymentMethod.id,
          billingDetails: billingDetailsPayload,
        });
        if (!customerResult.success) {
          toast.error(customerResult.error || 'Failed to create Stripe customer');
          set({ loading: false });
          return;
        }
        const customerId = customerResult.customerId;
        console.log('customerId: ', customerId);

        // Save payment method details to Firestore
        const saveResult = await paymentService.savePaymentMethodDetails({
          userRef: `/users/${userId}`,
          paymentMethod,
          billingDetails: {
            nameOnCard: formData.nameOnCard,
            streetAddress: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            zip: formData.zip,
          },
        });
        if (!saveResult.success) {
          toast.error(saveResult.error || 'Failed to save payment method details');
          set({ loading: false });
          return;
        }

        // Fetch the saved payment method and update state
        await get().fetchPaymentMethodByUser(userRef);

        // Update stripeCompanies document with billing address
        try {
          // Get the address from the payment method
          const address = paymentMethod.billing_details?.address || {};
          const email = paymentMethod.billing_details?.email || userData.email || userData.Email;

          // Lookup country name from code
          let countryName = address.country;
          if (address.country) {
            try {
              // Use countries-list for country code to name
              const { countries } = await import('countries-list');
              const code = address.country as keyof typeof countries;
              countryName = countries[code]?.name || address.country;
            } catch (e) {
              // fallback to code
              countryName = address.country;
            }
          }

          // Find the stripeCompanies document
          const stripeCompaniesRef = collection(db, "stripeCompanies");
          const q = query(stripeCompaniesRef, where("User", "==", userDoc["Company Admin"]));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            await updateDoc(docSnap.ref, {
              Email: email,
              "Street Address": address.line1 || '',
              City: address.city || '',
              State: address.state || '',
              Country: countryName || '',
              Zip: address.postal_code || '',
            });
          }
        } catch (err) {
          console.error('Failed to update stripeCompanies billing address:', err);
        }

        // Update subscription doc with new Stripe Customer Id
        const subscriptionsRef = collection(db, "subscriptions");
        const subSnap = await getDocs(query(subscriptionsRef, where("User", "==", userRef)));
        console.log('subSnap: ', subSnap);
        if (!subSnap.empty) {
          await updateDoc(subSnap.docs[0].ref, { "Stripe Customer Id": customerId });
        }

        // If adsAccounts > 0, create Stripe subscription
        if (adsAccountsCount > 0) {
          // Call backend API to create subscription (implement /api/stripe-subscriptions)
          const priceId = process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID;
          // Log all fields passed into the body for debugging
          console.log('Creating Stripe subscription with:', {
            customerId,
            priceId,
            quantity: adsAccountsCount,
            paymentMethodId: paymentMethod.id,
          });
          const subRes = await fetch("/api/stripe-subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId,
              priceId,
              quantity: adsAccountsCount,
              paymentMethodId: paymentMethod.id,
            }),
          });
          const subData = await subRes.json();
          console.log('subData: ', subData);
          if (!subRes.ok || subData.error) {
            toast.error((subData.error || 'Stripe subscription error') + ' Your subscription payment has failed. Please update your payment method to avoid any service interruptions.');
            set({ loading: false });
            return;
          }
          // Update subscription doc with subscription id and status
          if (!subSnap.empty) {
            await updateDoc(subSnap.docs[0].ref, {
              "Stripe Subscription Id": subData.subscriptionId,
              "Stripe Subscription Item Id(s)": [subData.subscriptionId],
              "User Status": "Paying",
            });
          }
          toast.success("You've successfully subscribed to AdAlerts.io");

          // Fetch invoices (implement /api/stripe-invoices)
          const invRes = await fetch(`/api/stripe-invoices?customerId=${customerId}`);
          const invData = await invRes.json();
          if (invRes.ok && invData.invoices) {
            set({ invoices: invData.invoices });
          }
          onBack();
        }
      }
      set({ loading: false });
    } catch (error: any) {
      console.error('handleSubscriptionPayment error:', error);
      toast.error(error.message || 'An error occurred while processing payment');
      set({ loading: false, error: error.message });
    }
  },
}));