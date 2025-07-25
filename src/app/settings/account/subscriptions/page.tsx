"use client";

import { Check, AlertTriangle, XIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAlertSettingsStore } from "@/lib/store/settings-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useEffect, useState } from "react";
import { SUBSCRIPTION_PRICES } from "@/lib/constants";

export default function SubscriptionsSubtab() {
  const { adsAccounts, fetchAdsAccounts, loading, deleteCompanyAccount } = useAlertSettingsStore();
  const { userDoc, logout } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userDoc?.["Company Admin"] && !adsAccounts.length) {
      fetchAdsAccounts(userDoc["Company Admin"]);
    }
  }, [userDoc, adsAccounts.length, fetchAdsAccounts]);

  const connectedAccountsCount = adsAccounts.length;

  // Calculate subscription price based on number of ads accounts
  const calculateSubscriptionPrice = () => {
    if (connectedAccountsCount === 0) {
      return 0;
    } else if (connectedAccountsCount === 1) {
      return SUBSCRIPTION_PRICES.FIRST_ADS_ACCOUNT;
    } else {
      return (
        SUBSCRIPTION_PRICES.FIRST_ADS_ACCOUNT +
        SUBSCRIPTION_PRICES.ADDITIONAL_ADS_ACCOUNT *
          (connectedAccountsCount - 1)
      );
    }
  };

  const subscriptionPrice = calculateSubscriptionPrice();

  // TODO: need to test
  const handleDeleteCompanyAccount = async () => {
    if (!userDoc?.["Company Admin"]) return;
    setIsDeleting(true);
    try {
      await deleteCompanyAccount(userDoc["Company Admin"], logout);
    } catch (error) {
      console.error("Error deleting company account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-xl font-bold mb-6">Subscriptions</h2>

        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold">
              <span className="text-blue-600">${subscriptionPrice}</span>
              <span className="text-gray-600">/Monthly</span>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-blue-600 font-semibold">
                {connectedAccountsCount}
              </span>
              <span className="text-gray-600"> Connected ads account(s)</span>
            </div>
          </div>
          <div className="text-gray-700">
            $59/mo for the first ads account and $19 for each additional one.{" "}
            Update or add your payment method{" "}
            <Link
              href="/settings/account/billing"
              className="text-blue-600 hover:underline"
            >
              here
            </Link>
            .
          </div>
        </div>

        {/* Included Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Included Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Unlimited ad alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Negative trends detection</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Budget pacing monitoring</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Policy Monitoring</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Over 250 daily KPI audits</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Sudden drop detection</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Spend forecasting</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">
                  Landing page uptime monitoring
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cancellation */}
      <div className="flex items-center gap-3 text-gray-700">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <span>
          I would like to{" "}
          <button
            className="text-red-500 hover:underline font-medium"
            onClick={() => setShowDeleteModal(true)}
          >
            cancel
          </button>{" "}
          my adAlert.io account. All data will be deleted and all user will lose
          access!
        </span>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img
                  src="/images/adAlert-logo-words.avif"
                  alt="adAlert.io"
                  className="h-8 w-auto"
                />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">
                Are you sure you want to{" "}
                <span className="text-red-600">DELETE</span> your adAlert.io
                account?
              </h3>
              <p className="text-gray-700">
                All users will lose their data and access instantly!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                onClick={async () => {
                  try {
                    await handleDeleteCompanyAccount();
                  } catch (error: any) {
                    console.error("Error deleting account:", error);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
