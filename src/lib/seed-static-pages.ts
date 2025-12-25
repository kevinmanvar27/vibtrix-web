import prisma from "./prisma";

import debug from "@/lib/debug";

export const DEFAULT_STATIC_PAGES = [
  {
    title: "Terms and Conditions",
    slug: "terms-and-conditions",
    content: `<h1>Terms and Conditions</h1>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h2>1. Acceptance of Terms</h2>
<p>Welcome to Vibtrix, a social media platform for video competitions. By accessing or using our platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>

<h2>2. User Accounts</h2>
<p>When you create an account with us, you must provide accurate and complete information including your username, email, and optional details such as gender, date of birth, and WhatsApp number. You are responsible for maintaining the security of your account and password. Vibtrix cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>

<h2>3. Authentication Methods</h2>
<p>Vibtrix offers multiple authentication methods including:</p>
<ul>
  <li>Email and password login</li>
  <li>Google authentication</li>
  <li>WhatsApp authentication</li>
</ul>
<p>You are responsible for all activities that occur under your chosen authentication method.</p>

<h2>4. User Profiles</h2>
<p>Users can set their profiles as public or private. For private profiles, other users must send follow requests which you can approve or deny. Your online status (online, away, offline) will be visible to other users unless you disable this feature in your settings.</p>

<h2>5. Content Guidelines</h2>
<p>Users may not post content that:</p>
<ul>
  <li>Is illegal, obscene, or offensive</li>
  <li>Infringes on intellectual property rights</li>
  <li>Contains malware or harmful code</li>
  <li>Harasses, bullies, or intimidates others</li>
  <li>Impersonates another person</li>
</ul>
<p>Vibtrix supports multiple media types including images and videos with no size limits. Users can upload multiple images which will be displayed as a slider.</p>

<h2>6. Competitions</h2>
<p>Vibtrix hosts various competitions for users. By participating in competitions:</p>
<ul>
  <li>You agree to follow all competition-specific rules</li>
  <li>You understand that paid competitions require payment through Razorpay before participation</li>
  <li>You acknowledge that competitions may have age restrictions and multiple rounds</li>
  <li>You can only upload one post per competition round</li>
  <li>You grant Vibtrix the right to display your submissions</li>
  <li>You acknowledge that judging is based on likes received and decisions are final</li>
  <li>Prize money will be distributed automatically to winners through Razorpay</li>
</ul>

<h2>7. Communication Features</h2>
<p>Vibtrix provides a custom chat system built with Next.js. When using our communication features:</p>
<ul>
  <li>You can message other users directly</li>
  <li>You can share posts within messages</li>
  <li>You cannot message users who have blocked you</li>
  <li>All communications should adhere to our content guidelines</li>
</ul>

<h2>8. Blocking and Reporting</h2>
<p>Users can block other users, preventing them from searching for, messaging, or accessing their profiles. Vibtrix reserves the right to suspend or terminate accounts that violate our terms.</p>

<h2>9. Advertisements</h2>
<p>Vibtrix may display advertisements on the platform. Advertisements with expired dates will automatically be marked as expired.</p>

<h2>10. Limitation of Liability</h2>
<p>Vibtrix is provided "as is" without warranties of any kind. In no event shall Vibtrix be liable for any damages arising out of the use or inability to use our services. We implement adaptive quality streaming for images/videos based on internet speed, but cannot guarantee uninterrupted service.</p>

<h2>11. Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the top of this page.</p>

<h2>12. Contact Information</h2>
<p>If you have any questions about these Terms, please contact us at support@vibtrix.com.</p>`,
    isPublished: true,
  },
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: `<h1>Privacy Policy</h1>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h2>1. Information We Collect</h2>
<p>We collect several types of information from and about users of our Vibtrix platform, including:</p>
<ul>
  <li><strong>Personal Information:</strong> Name, email address, WhatsApp number, date of birth, and gender</li>
  <li><strong>Account Information:</strong> Username, display name, password, and profile details</li>
  <li><strong>Profile Information:</strong> Avatar/profile picture, bio, and online status</li>
  <li><strong>Content:</strong> Photos, videos, comments, and messages you post or send</li>
  <li><strong>Competition Data:</strong> Competition entries, likes, and participation history</li>
  <li><strong>Payment Information:</strong> When you participate in paid competitions (processed securely through Razorpay)</li>
  <li><strong>Usage Data:</strong> How you interact with our platform, including viewing habits, post views, and features used</li>
  <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Create and manage your account with public or private profile settings</li>
  <li>Display your online status to other users (if enabled)</li>
  <li>Process and display your competition entries</li>
  <li>Enable following/follower relationships and follow requests</li>
  <li>Facilitate direct messaging between users</li>
  <li>Process payments and prize distributions through Razorpay</li>
  <li>Implement user blocking functionality</li>
  <li>Provide adaptive quality streaming based on your internet speed</li>
  <li>Send notifications and updates about our platform</li>
  <li>Respond to your comments and questions</li>
  <li>Protect against fraudulent or illegal activity</li>
</ul>

<h2>3. Information Sharing</h2>
<p>We may share your information with:</p>
<ul>
  <li>Other Vibtrix users, as part of your public profile and content (if your profile is set to public)</li>
  <li>Razorpay for processing competition payments and prize distributions</li>
  <li>Service providers who perform services on our behalf, including for media storage on UploadThing (hostname 'utfs.io')</li>
  <li>Admin users who may access user information for platform management</li>
  <li>Legal authorities when required by law</li>
</ul>

<h2>4. Your Privacy Choices</h2>
<p>You can control your privacy settings within your account, including:</p>
<ul>
  <li>Making your profile public or private</li>
  <li>Controlling who can follow you or view your content</li>
  <li>Showing or hiding your online status</li>
  <li>Blocking specific users from finding or contacting you</li>
  <li>Managing notification preferences</li>
</ul>

<h2>5. Admin Access</h2>
<p>Please note that Vibtrix administrators can:</p>
<ul>
  <li>Access user information for platform management</li>
  <li>Log in as any user directly from the user list for support purposes</li>
  <li>Manage competition entries and results</li>
</ul>
<p>All admin actions are governed by role-based permissions.</p>

<h2>6. Data Security</h2>
<p>We implement appropriate security measures to protect your personal information, including secure authentication methods. However, no method of transmission over the Internet is 100% secure.</p>

<h2>7. Data Retention</h2>
<p>We store your information for as long as your account is active or as needed to provide you services. You can request deletion of your account by contacting our support team.</p>

<h2>8. Children's Privacy</h2>
<p>Our platform implements age restrictions for certain competitions. We do not knowingly collect information from children under 13.</p>

<h2>9. International Data Transfers</h2>
<p>Your information may be transferred to and processed in countries other than your own. The default time zone for the platform is set to India.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

<h2>11. Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact us at privacy@vibtrix.com.</p>`,
    isPublished: true,
  },
  {
    title: "Refund Policy",
    slug: "refund-policy",
    content: `<h1>Refund Policy</h1>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h2>1. Competition Entry Fees</h2>
<p>Vibtrix charges fees for entry into certain competitions, processed through Razorpay. Our refund policy for these fees is as follows:</p>

<h3>1.1 Before Competition Start</h3>
<p>If you withdraw from a competition before its official start date, you may be eligible for a full refund of your entry fee. Requests must be submitted at least 48 hours before the competition begins.</p>

<h3>1.2 After Competition Start</h3>
<p>Once a competition has started, entry fees are generally non-refundable. This includes situations where:</p>
<ul>
  <li>You decide not to participate after the competition has begun</li>
  <li>You are disqualified for violating competition rules</li>
  <li>You are unable to complete your submissions on time</li>
  <li>You do not receive enough likes to advance to the next round</li>
  <li>You are unable to participate due to age restrictions</li>
</ul>

<h3>1.3 Competition Cancellation</h3>
<p>If Vibtrix cancels a competition, all participants will receive a full refund of their entry fees through Razorpay.</p>

<h2>2. Technical Issues</h2>
<p>If you experience technical issues that prevent you from participating in a competition, you may request a refund by contacting our support team within 24 hours of the issue. Each case will be reviewed individually by our admin team.</p>

<h3>2.1 Valid Technical Issues</h3>
<p>The following may be considered valid technical issues:</p>
<ul>
  <li>Server outages affecting all users</li>
  <li>Payment processing errors through Razorpay</li>
  <li>Competition round timing errors</li>
</ul>

<h3>2.2 Non-Refundable Technical Issues</h3>
<p>The following are generally not grounds for refunds:</p>
<ul>
  <li>Poor internet connection on the user's end</li>
  <li>Device compatibility issues</li>
  <li>User error in uploading content</li>
  <li>Failure to meet competition deadlines</li>
</ul>

<h2>3. Prize Distribution</h2>
<p>Prize money for competition winners is distributed automatically through Razorpay. If you experience issues with prize distribution, please contact our support team with the following information:</p>
<ul>
  <li>Competition name and ID</li>
  <li>Your username</li>
  <li>Placement in the competition</li>
  <li>Expected prize amount</li>
  <li>Razorpay transaction details (if available)</li>
</ul>

<h2>4. Refund Process</h2>
<p>To request a refund:</p>
<ol>
  <li>Log in to your Vibtrix account</li>
  <li>Go to your Payment History</li>
  <li>Select the transaction and click "Request Refund"</li>
  <li>Provide the reason for your refund request</li>
</ol>
<p>Alternatively, you can contact our support team at refunds@vibtrix.com.</p>

<h2>5. Refund Timeline</h2>
<p>Approved refunds will be processed within 5-7 business days through Razorpay. The time it takes for the refund to appear in your account depends on your payment method and financial institution.</p>

<h2>6. Changes to This Policy</h2>
<p>We reserve the right to modify this refund policy at any time. Changes will be effective immediately upon posting to this page.</p>`,
    isPublished: true,
  },
  {
    title: "Copyright",
    slug: "copyright",
    content: `<h1>Copyright Policy</h1>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h2>1. Copyright Ownership and Protection</h2>
<p>Vibtrix respects the intellectual property rights of others and expects users to do the same. All content on Vibtrix, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, and software, is the property of Vibtrix or its content suppliers and is protected by international copyright laws.</p>

<p>The Vibtrix platform, including its unique features, user interface, and underlying code, is protected by copyright, trademark, and other intellectual property laws. Unauthorized use, reproduction, modification, distribution, display, or performance of the platform or its content is strictly prohibited.</p>

<h2>2. User Content Ownership and Licensing</h2>
<p>When you upload content to Vibtrix:</p>
<ul>
  <li>You retain ownership of your content and all intellectual property rights associated with it</li>
  <li>You grant Vibtrix a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to use, store, display, reproduce, modify, and distribute your content on our platform</li>
  <li>This license allows us to display your content to other users, promote your content on and off the platform, and use your content to improve our services</li>
  <li>This license remains in effect even if you stop using our services, but you can delete your content at any time to terminate this license</li>
  <li>You represent and warrant that you own or have the necessary rights to the content you post</li>
  <li>You understand that your content may be viewed, liked, and commented on by other users</li>
  <li>You acknowledge that your content may be used in competitions and may be eligible for prizes</li>
</ul>

<h2>3. Media Storage and Technical Implementation</h2>
<p>Vibtrix uses UploadThing (hostname 'utfs.io') for file storage. When you upload media:</p>
<ul>
  <li>There are no media size limits on the application, allowing you to upload high-quality content</li>
  <li>Multiple image uploads will display as a slider similar to Instagram, enhancing user experience</li>
  <li>We implement adaptive quality streaming for images/videos based on internet speed to ensure optimal viewing</li>
  <li>View counts are tracked for all post types to measure engagement</li>
  <li>All uploaded media is stored securely and in compliance with applicable data protection laws</li>
  <li>While we maintain backups of user content, we recommend keeping original copies of your important media</li>
</ul>

<h2>4. Competition Content and Rights</h2>
<p>When you participate in competitions on Vibtrix:</p>
<ul>
  <li>You grant Vibtrix the right to display your submissions across the platform</li>
  <li>You understand that competition entries may include promotion stickers or watermarks</li>
  <li>You acknowledge that your content will be judged based on likes received and other criteria specified in the competition rules</li>
  <li>You retain ownership of your competition submissions, but grant us license to use them for promotional purposes</li>
  <li>You agree that winning entries may be featured more prominently on the platform</li>
  <li>You understand that Vibtrix may use competition entries for marketing purposes, including on social media and in advertisements</li>
</ul>

<h2>5. Fair Use</h2>
<p>Vibtrix respects the principle of fair use, which allows limited use of copyrighted material without permission for purposes such as commentary, criticism, news reporting, teaching, and research. However, determination of fair use depends on several factors, including:</p>
<ul>
  <li>The purpose and character of the use (commercial vs. non-commercial)</li>
  <li>The nature of the copyrighted work</li>
  <li>The amount and substantiality of the portion used</li>
  <li>The effect of the use on the potential market for the original work</li>
</ul>
<p>Users should exercise caution when claiming fair use and should not use it as a justification for copyright infringement.</p>

<h2>6. Copyright Infringement Reporting</h2>
<p>If you believe that your work has been copied in a way that constitutes copyright infringement, please provide our copyright agent with the following information:</p>
<ul>
  <li>A physical or electronic signature of the copyright owner or authorized person</li>
  <li>Identification of the copyrighted work claimed to have been infringed</li>
  <li>Identification of the material that is claimed to be infringing (including URL or specific location on Vibtrix)</li>
  <li>Your contact information (address, telephone number, email)</li>
  <li>A statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law</li>
  <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf</li>
</ul>

<h2>7. DMCA Takedown Procedure</h2>
<p>Vibtrix follows the procedures outlined in the Digital Millennium Copyright Act (DMCA) for addressing claims of copyright infringement. Upon receiving a valid DMCA notice, we will:</p>
<ol>
  <li>Remove or disable access to the allegedly infringing content promptly</li>
  <li>Notify the content provider of the takedown and provide them with a copy of the DMCA notice</li>
  <li>Provide the content provider with an opportunity to submit a counter-notice if they believe the content was removed in error</li>
  <li>Restore the content if a valid counter-notice is received and the copyright owner does not notify us that they have filed a legal action</li>
</ol>

<h2>8. Counter-Notice Procedure</h2>
<p>If you believe your content was removed in error, you may submit a counter-notice containing:</p>
<ul>
  <li>Your physical or electronic signature</li>
  <li>Identification of the material that has been removed</li>
  <li>A statement under penalty of perjury that you have a good faith belief the material was removed as a result of mistake or misidentification</li>
  <li>Your name, address, and telephone number</li>
  <li>A statement that you consent to the jurisdiction of the federal court in the district where you reside</li>
  <li>A statement that you will accept service of process from the person who provided the original notification</li>
</ul>

<h2>9. Repeat Infringer Policy</h2>
<p>Vibtrix maintains a strict policy of terminating accounts of users who are repeat copyright infringers. We consider a user to be a repeat infringer when:</p>
<ul>
  <li>We receive multiple valid DMCA notices related to their content</li>
  <li>They repeatedly post content that clearly infringes on others' copyrights</li>
  <li>They have been warned about copyright infringement but continue to violate our policies</li>
</ul>
<p>Administrators have the ability to remove infringing content and take appropriate action against violating accounts, including temporary suspension or permanent termination.</p>

<h2>10. Branding and Logos</h2>
<p>The Vibtrix name, logo, and branding elements are protected by copyright and trademark laws. Unauthorized use of these elements is prohibited. Please note:</p>
<ul>
  <li>Administrators can update the logo and favicon through the admin panel settings</li>
  <li>The Vibtrix logo may not be used in a way that suggests partnership or endorsement without explicit permission</li>
  <li>The Vibtrix name may not be used in domain names, social media handles, or business names without permission</li>
  <li>Vibtrix's distinctive user interface elements may not be copied or imitated</li>
</ul>

<h2>11. Content License for Developers</h2>
<p>Developers who wish to access Vibtrix content through our API must respect copyright restrictions and:</p>
<ul>
  <li>Only access content through authorized API endpoints</li>
  <li>Respect user privacy settings and content visibility restrictions</li>
  <li>Properly attribute content to its original creators</li>
  <li>Not cache or store content longer than necessary for the intended functionality</li>
  <li>Comply with all terms of our Developer Agreement</li>
</ul>

<h2>12. International Copyright Protection</h2>
<p>Vibtrix respects copyright laws worldwide. We may respond to notices of alleged copyright infringement and terminate accounts of users according to the laws of multiple jurisdictions, not limited to the United States DMCA process.</p>

<h2>13. Contact Information</h2>
<p>Our designated copyright agent can be reached at:</p>
<p>Copyright Agent<br>
Vibtrix<br>
Email: copyright@vibtrix.com</p>

<h2>14. Changes to This Policy</h2>
<p>We reserve the right to modify this Copyright Policy at any time. Changes will be effective immediately upon posting to this page. We encourage users to review this policy periodically for updates.</p>`,
    isPublished: true,
  },
];

export async function seedStaticPages() {
  debug.log("Checking for default static pages...");

  try {
    // Check if the pages table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'pages'
      ) as exists
    `;

    const pagesTableExists = (tableExists as any)[0]?.exists;

    if (!pagesTableExists) {
      debug.log("Pages table does not exist. Skipping static pages seeding.");
      return;
    }

    // If the table exists, proceed with seeding
    for (const page of DEFAULT_STATIC_PAGES) {
      try {
        const existingPage = await prisma.page.findUnique({
          where: { slug: page.slug },
        });

        if (!existingPage) {
          debug.log(`Creating default page: ${page.title}`);
          await prisma.page.create({
            data: page,
          });
        }
      } catch (error) {
        debug.error(`Error checking/creating page ${page.slug}:`, error);
      }
    }

    debug.log("Static pages check completed");
  } catch (error) {
    debug.error("Error in seedStaticPages:", error);
  }
}
