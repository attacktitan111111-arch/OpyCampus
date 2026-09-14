import { NextRequest, NextResponse } from "next/server";

const PAGES: Record<string, { title: string; body: string }> = {
  terms: {
    title: "Terms of Service",
    body: `Last updated: ${new Date().toLocaleDateString("en", { month: "long", year: "numeric" })}

1. Acceptance of Terms
By creating an account or using OpyCampus, you agree to these Terms. If you don't agree, don't use the platform.

2. Eligibility
OpyCampus is designed for students, teachers, and educational institutions. You must be at least 13 years old (or the minimum age in your country) to create an account.

3. Your Account
You're responsible for keeping your password secure and for all activity under your account. Provide accurate information when signing up — including your real name and educational affiliation.

4. Acceptable Use
You agree NOT to:
- Post content that is unlawful, hateful, harassing, or threatens others
- Impersonate another person or institution
- Share others' private information without consent
- Post spam or commercial content unrelated to education
- Upload malware or attempt to disrupt the service
- Create fake accounts or bots

5. Your Content
You retain ownership of content you post. By posting, you grant OpyCampus a license to host, display, and distribute it within the platform. You can delete your content at any time.

6. Educational Institution Feeds
Institution feeds may be private. Only members of verified institutions can post to institution feeds. Institutions' admins are responsible for moderating their own feeds.

7. Termination
We can suspend or terminate accounts that violate these Terms. You can delete your account at any time.

8. Disclaimers
OpyCampus is provided "as is" without warranties. We're not liable for damages arising from use of the platform.

9. Changes
We may update these Terms. We'll notify users of significant changes.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `Last updated: ${new Date().toLocaleDateString("en", { month: "long", year: "numeric" })}

1. Information We Collect
- Account info: name, username, email, password (hashed), role, institution, department
- Content you post: text, images, videos
- Usage data: which posts you interact with, notifications
- Device info: IP address, browser type (for security)

2. How We Use Your Information
- To provide the platform: showing your feed, profile, notifications
- To connect you with classmates and institution members
- To keep the service secure and prevent abuse
- To send notifications about likes, replies, and follows

3. Information Sharing
We do NOT sell your data. We share information only:
- With members of your private institution/community feeds
- When required by law
- In aggregated, anonymized form for analytics

4. Your Controls
- You can make your profile public or limit who sees your content
- You can delete posts, comments, and your account
- You can control notification preferences in Settings
- Institution feeds are only visible to verified members

5. Data Security
Passwords are hashed with scrypt. Session tokens are opaque and hashed. File uploads are scanned for type and size. We use HTTPS in production.

6. Data Retention
We keep your data while your account is active. When you delete your account, we remove your content within 30 days.

7. Children's Privacy
OpyCampus is not directed to children under 13. We don't knowingly collect data from children under 13.

8. Your Rights
You can request a copy of your data or request deletion by contacting us. You can edit your profile information anytime in Settings.

9. Contact
For privacy questions, contact privacy@opycampus.app`,
  },
  guidelines: {
    title: "Community Guidelines",
    body: `OpyCampus is a space for students and educators to connect, learn, and share. These guidelines help keep it welcoming for everyone.

1. Be authentic
Use your real name. Represent your actual school, college, or university. Fake accounts will be removed.

2. Be respectful
Treat classmates, teachers, and staff with respect. No harassment, bullying, hate speech, or threats.

3. Be helpful
Share notes, answer questions, start study groups. That's what OpyCampus is for.

4. Keep it legal
Don't share copyrighted material without permission. Don't post others' private information.

5. No spam
Don't post repetitive, promotional, or irrelevant content. Don't mass-follow or mass-message.

6. Report problems
If you see content that violates these guidelines, use the Report button. Our team reviews reports promptly.

7. Institution feeds
Each institution can set its own rules for its private feed. Follow your school's guidelines and code of conduct.

8. Consequences
Violations may result in content removal, temporary suspension, or permanent account ban, depending on severity.`,
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "terms";
  const content = PAGES[page] ?? PAGES.terms;
  return NextResponse.json(content);
}
