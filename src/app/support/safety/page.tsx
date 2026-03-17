/**
 * Data Safety & Security Standards Page
 * Required by Google Play Store for Data Safety section
 */

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Safety & Security - Vibetrix",
  description: "Learn about how Vibetrix collects, uses, and protects your data.",
};

export default function DataSafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Data Safety & Security
          </h1>
          <p className="text-lg text-gray-600">
            Your privacy and security are our top priorities
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          
          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Vibetrix is committed to protecting your personal information and your right to privacy. 
              This page explains what data we collect, how we use it, and the security measures we take 
              to protect your information.
            </p>
          </section>

          {/* Data Collection */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data We Collect
            </h2>
            
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Personal Information
                </h3>
                <ul className="space-y-2 text-gray-700 ml-7">
                  <li>• Email address (for account creation and communication)</li>
                  <li>• Username and display name</li>
                  <li>• Profile picture and bio</li>
                  <li>• Date of birth (for age verification)</li>
                </ul>
                <p className="text-sm text-purple-800 mt-3">
                  <strong>Purpose:</strong> Account management, authentication, and personalization
                </p>
              </div>

              {/* User-Generated Content */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  User-Generated Content
                </h3>
                <ul className="space-y-2 text-gray-700 ml-7">
                  <li>• Videos, photos, and reels you upload</li>
                  <li>• Comments, likes, and shares</li>
                  <li>• Messages and chat conversations</li>
                  <li>• Competition entries</li>
                </ul>
                <p className="text-sm text-blue-800 mt-3">
                  <strong>Purpose:</strong> Platform functionality, content sharing, and social interaction
                </p>
              </div>

              {/* Usage Data */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Usage & Analytics Data
                </h3>
                <ul className="space-y-2 text-gray-700 ml-7">
                  <li>• App usage patterns and interactions</li>
                  <li>• Device information (model, OS version)</li>
                  <li>• IP address and location data (approximate)</li>
                  <li>• Performance and crash data</li>
                </ul>
                <p className="text-sm text-green-800 mt-3">
                  <strong>Purpose:</strong> App improvement, bug fixes, and analytics
                </p>
              </div>

              {/* Device & Technical Data */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                  Device & Technical Information
                </h3>
                <ul className="space-y-2 text-gray-700 ml-7">
                  <li>• Device identifiers (for push notifications)</li>
                  <li>• Camera and microphone access (for content creation)</li>
                  <li>• Storage access (for media uploads)</li>
                  <li>• Network information</li>
                </ul>
                <p className="text-sm text-orange-800 mt-3">
                  <strong>Purpose:</strong> Core app functionality and features
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How We Use Your Data
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">✓</span>
                  <span><strong>Provide Services:</strong> Enable core features like posting, messaging, and competitions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">✓</span>
                  <span><strong>Personalization:</strong> Customize your feed and recommend content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">✓</span>
                  <span><strong>Communication:</strong> Send notifications, updates, and support messages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">✓</span>
                  <span><strong>Security:</strong> Detect fraud, abuse, and maintain platform safety</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">✓</span>
                  <span><strong>Analytics:</strong> Improve app performance and user experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-3">✓</span>
                  <span><strong>Legal Compliance:</strong> Meet legal obligations and enforce our terms</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Sharing & Third Parties
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We <strong>do NOT sell</strong> your personal information. We may share data with:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-l-4 border-purple-600 bg-purple-50 p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Service Providers</h3>
                  <p className="text-sm text-gray-700">
                    Cloud storage, analytics, and infrastructure providers who help us operate the app
                  </p>
                </div>
                <div className="border-l-4 border-blue-600 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Authentication Services</h3>
                  <p className="text-sm text-gray-700">
                    Google Sign-In, Apple Sign-In for secure authentication
                  </p>
                </div>
                <div className="border-l-4 border-green-600 bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Legal Requirements</h3>
                  <p className="text-sm text-gray-700">
                    When required by law, court order, or government request
                  </p>
                </div>
                <div className="border-l-4 border-orange-600 bg-orange-50 p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">Public Content</h3>
                  <p className="text-sm text-gray-700">
                    Your public posts and profile are visible to other users
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security Measures */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Security Measures
            </h2>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Encryption
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• HTTPS/TLS encryption for data in transit</li>
                    <li>• Encrypted password storage</li>
                    <li>• Secure API communications</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Access Control
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Secure authentication (OAuth 2.0)</li>
                    <li>• Role-based access control</li>
                    <li>• Session management</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Monitoring
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• 24/7 security monitoring</li>
                    <li>• Fraud detection systems</li>
                    <li>• Regular security audits</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Compliance
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• GDPR compliant</li>
                    <li>• Industry best practices</li>
                    <li>• Regular updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Privacy Rights
            </h2>
            <div className="space-y-3">
              <div className="flex items-start bg-white border-2 border-purple-200 rounded-lg p-4">
                <span className="text-2xl mr-3">👁️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Access Your Data</h3>
                  <p className="text-sm text-gray-600">Request a copy of your personal data</p>
                </div>
              </div>
              <div className="flex items-start bg-white border-2 border-blue-200 rounded-lg p-4">
                <span className="text-2xl mr-3">✏️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Update Information</h3>
                  <p className="text-sm text-gray-600">Correct or update your personal information</p>
                </div>
              </div>
              <div className="flex items-start bg-white border-2 border-red-200 rounded-lg p-4">
                <span className="text-2xl mr-3">🗑️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Your Account</h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and data. 
                    <Link href="/support/delete-account" className="text-purple-600 hover:text-purple-700 ml-1">
                      Learn how →
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex items-start bg-white border-2 border-green-200 rounded-lg p-4">
                <span className="text-2xl mr-3">🔔</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Control Notifications</h3>
                  <p className="text-sm text-gray-600">Manage your notification preferences</p>
                </div>
              </div>
              <div className="flex items-start bg-white border-2 border-orange-200 rounded-lg p-4">
                <span className="text-2xl mr-3">🚫</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Opt-Out</h3>
                  <p className="text-sm text-gray-600">Opt-out of marketing communications</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Retention
            </h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-gray-700">
                We retain your data for as long as your account is active or as needed to provide services. 
                When you delete your account, we remove your data within <strong>30 days</strong>, except where 
                we're required to retain it for legal, security, or fraud prevention purposes.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Children's Privacy
            </h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-gray-700 mb-3">
                Vibetrix is intended for users aged <strong>13 and above</strong>. We do not knowingly collect 
                personal information from children under 13. If we discover that we have collected data from 
                a child under 13, we will delete it immediately.
              </p>
              <p className="text-sm text-blue-800">
                Parents: If you believe your child has provided us with personal information, please contact us 
                at <a href="mailto:support@vibetrix.com" className="underline">support@vibetrix.com</a>
              </p>
            </div>
          </section>

          {/* Contact & Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Us & Policy Updates
            </h2>
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-2">Questions or Concerns?</h3>
                <p className="text-gray-700 mb-3">
                  If you have any questions about our data practices or this policy, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <strong>Email:</strong> <a href="mailto:support@vibetrix.com" className="text-purple-600 hover:text-purple-700 ml-1">support@vibetrix.com</a>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                    <strong>Website:</strong> <a href="https://vibetrix.com" className="text-purple-600 hover:text-purple-700 ml-1">vibetrix.com</a>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Policy Updates:</strong> We may update this policy from time to time. We'll notify you of 
                  significant changes via email or in-app notification. Last updated: March 17, 2026
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-6 text-sm flex-wrap gap-2">
            <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
              ← Back to Home
            </Link>
            <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
              Terms of Service
            </Link>
            <Link href="/support/delete-account" className="text-purple-600 hover:text-purple-700 font-medium">
              Delete Account
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 Vibetrix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
