/**
 * Account Deletion Support Page
 * Required by Google Play Store for account deletion policy
 */

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete Your Account - Vibetrix",
  description: "Learn how to permanently delete your Vibetrix account and all associated data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Delete Your Account
          </h1>
          <p className="text-lg text-gray-600">
            Follow these simple steps to permanently delete your Vibetrix account.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Steps */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              How to Delete Your Account
            </h2>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Open the Vibetrix App</h3>
                  <p className="mt-1 text-gray-600">
                    Launch the Vibetrix application on your mobile device.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Go to Your Profile</h3>
                  <p className="mt-1 text-gray-600">
                    Tap on the <strong>Profile</strong> icon at the bottom navigation bar.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Open Settings</h3>
                  <p className="mt-1 text-gray-600">
                    Tap on the <strong>Settings</strong> icon (⚙️) in the top right corner.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    4
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Select Account Settings</h3>
                  <p className="mt-1 text-gray-600">
                    Scroll down and tap on <strong>Account Settings</strong>.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    5
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tap Delete Account</h3>
                  <p className="mt-1 text-gray-600">
                    Scroll to the bottom and tap on <strong>Delete Account</strong> button.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    6
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                  <p className="mt-1 text-gray-600">
                    Enter your password and confirm that you want to permanently delete your account.
                  </p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                    7
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Account Deleted</h3>
                  <p className="mt-1 text-gray-600">
                    Your account and all associated data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Warning:</strong> This action is permanent and cannot be undone. All your data including posts, videos, messages, and followers will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What Gets Deleted */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What Gets Deleted?
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Your profile information (username, display name, bio, avatar)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>All your posts, reels, and videos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>All your comments and likes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Your followers and following lists</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>All your messages and conversations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Competition entries and history</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Notifications and preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>All other account data</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Need Help */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Need Help?
            </h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-gray-700 mb-3">
                If you're having trouble deleting your account or have any questions, please contact our support team:
              </p>
              <a
                href="mailto:support@vibetrix.com"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            © 2026 Vibetrix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
