import { Scale } from 'lucide-react';
import { Card, CardContent } from '@jyotish/ui/card';
import { Navbar } from '@/components/ui';
import { Footer } from '@/components/home/Footer';
import Link from 'next/link';
import { ROUTES } from '@/constants';

const LAST_UPDATED = 'March 25, 2026';
const APP_NAME = 'Chat Jyotish';
const COMPANY_NAME = 'Chat Jyotish';
const EMAIL = 'chatjyotishiofficial@gmail.com';
const WHATSAPP_NUMBER = '9706732691';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black relative">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-24">
        <div className="space-y-8 max-w-3xl mx-auto pb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4">
              <Scale className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-sm text-purple-400 font-medium mb-1">Terms of Service for {APP_NAME}</p>
            <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-gray-400 text-lg">Last updated: {LAST_UPDATED}</p>
          </div>

          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardContent className="p-6 sm:p-8 space-y-8 text-gray-300 text-sm leading-relaxed">
              <section className="space-y-3">
                <p>
                  These Terms of Service (&quot;Terms&quot;) govern Your access to and use of the{' '}
                  {APP_NAME} mobile and web application (the &quot;Service&quot;) operated by{' '}
                  {COMPANY_NAME} (&quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;, or
                  &quot;Our&quot;). By creating an account, accessing, or using the Service, You
                  agree to be bound by these Terms. If You do not agree, do not use the Service.
                </p>
                <p>
                  Please also read our{' '}
                  <Link
                    href={ROUTES.PRIVACY}
                    className="text-purple-400 underline underline-offset-2 hover:text-purple-300 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  , which explains how We collect and use personal information.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Definitions</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-200">Account</strong> means a registered user
                    profile that allows You to access features of the Service.
                  </li>
                  <li>
                    <strong className="text-gray-200">Balance</strong> means Your in-app credits
                    used to purchase consultations, messages, or other paid features, as described
                    in the Service.
                  </li>
                  <li>
                    <strong className="text-gray-200">Jyotish / Astrologer</strong> means independent
                    practitioners who use the platform to provide astrological and related services
                    to users.
                  </li>
                  <li>
                    <strong className="text-gray-200">You</strong> means the individual or entity
                    using the Service.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Eligibility</h2>
                <p>
                  The Service is intended for users who are at least 16 years of age or the age of
                  digital consent in Your jurisdiction, whichever is higher. By using the Service,
                  You represent that You meet this requirement. If You use the Service on behalf of a
                  business, You represent that You have authority to bind that entity to these
                  Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Accounts and Registration</h2>
                <p>
                  You must provide accurate, current, and complete information when creating an
                  Account. You are responsible for safeguarding Your credentials and for all activity
                  under Your Account. You must notify Us promptly of any unauthorized use.
                </p>
                <p>
                  We may suspend or terminate Accounts that violate these Terms, pose security
                  risks, or misuse the Service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">The Service</h2>
                <p>
                  {APP_NAME} provides a platform for users to connect with Jyotish for chat,
                  consultations, appointments, broadcasts, and related features. The Company
                  operates the technology platform; Jyotish are independent providers, not Our
                  employees, unless expressly stated otherwise for specific programs.
                </p>
                <p>
                  We may modify, suspend, or discontinue features of the Service with reasonable
                  notice where practicable. We do not guarantee uninterrupted or error-free
                  operation.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Payments, Balance, and Refunds</h2>
                <p>
                  Paid features may require a sufficient account balance or other payment methods.
                  Prices and packages are displayed within the Service. You agree to pay all charges
                  associated with Your use of paid features.
                </p>
                <p>
                  Top-ups to Your balance and use of balance are subject to the rules shown at the
                  time of purchase (including any promotional or refund policies for specific
                  product flows, such as automatic refunds when a broadcast request expires without
                  acceptance).
                </p>
                <p>
                  Unless required by law or expressly stated in the Service, payments are
                  non-refundable except at Our discretion or in accordance with our published refund
                  rules for specific scenarios.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">User Conduct</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Use the Service for any unlawful purpose or in violation of applicable laws in
                    Nepal or Your jurisdiction.
                  </li>
                  <li>
                    Harass, abuse, defame, threaten, or discriminate against others, including
                    Jyotish and support staff.
                  </li>
                  <li>
                    Attempt to gain unauthorized access to the Service, other users&apos; data, or Our
                    systems.
                  </li>
                  <li>
                    Use automated means (bots, scrapers) to access the Service without permission.
                  </li>
                  <li>
                    Circumvent payment, balance, or access controls, or resell access to the Service
                    without authorization.
                  </li>
                  <li>
                    Upload malware or content that infringes intellectual property or privacy rights
                    of others.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Astrology and Disclaimers</h2>
                <p>
                  Services provided through the platform (including horoscopes, readings, and
                  advice) are for personal, cultural, and entertainment purposes. They are not a
                  substitute for professional advice in legal, medical, financial, or mental health
                  matters. You should consult qualified professionals where appropriate.
                </p>
                <p>
                  We do not warrant the accuracy, completeness, or outcomes of any reading or
                  consultation. Jyotish are responsible for their own professional conduct within the
                  platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Intellectual Property</h2>
                <p>
                  The Service, including software, branding, logos, and content We create, is owned
                  by the Company or its licensors. Subject to these Terms, We grant You a limited,
                  non-exclusive, non-transferable license to use the Service for personal,
                  non-commercial purposes in accordance with these Terms.
                </p>
                <p>
                  You retain ownership of content You submit; You grant Us a license to host, use,
                  store, and display such content as needed to operate and improve the Service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, the Company and its affiliates shall not be
                  liable for any indirect, incidental, special, consequential, or punitive damages,
                  or for loss of profits, data, or goodwill, arising from Your use of the Service.
                </p>
                <p>
                  Our total liability for any claim arising out of or related to these Terms or the
                  Service shall not exceed the greater of (a) the amount You paid to Us for the
                  Service in the three (3) months preceding the claim, or (b) if no fees were paid,
                  one hundred Nepalese Rupees (NPR 100), except where such limitation is prohibited
                  by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Indemnity</h2>
                <p>
                  You agree to indemnify and hold harmless the Company and its affiliates, officers,
                  and employees from claims, damages, losses, and expenses (including reasonable
                  legal fees) arising from Your use of the Service, Your content, or Your violation
                  of these Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Termination</h2>
                <p>
                  You may stop using the Service at any time. We may suspend or terminate Your access
                  if You breach these Terms or if We need to do so for legal, security, or
                  operational reasons.
                </p>
                <p>
                  Provisions that by their nature should survive (including disclaimers, limitations
                  of liability, and indemnity) will survive termination.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Governing Law</h2>
                <p>
                  These Terms are governed by the laws of Nepal, without regard to conflict-of-law
                  principles. Courts in Nepal shall have exclusive jurisdiction, subject to any
                  mandatory consumer protections in Your jurisdiction.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Changes to These Terms</h2>
                <p>
                  We may update these Terms from time to time. We will post the revised Terms on
                  this page and update the &quot;Last updated&quot; date. Material changes may be
                  communicated through the Service or by email where appropriate. Continued use
                  after changes become effective constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Contact Us</h2>
                <p>For questions about these Terms of Service, contact Us:</p>
                <ul className="list-none space-y-2 pl-0">
                  <li>
                    <span className="text-gray-400">Email: </span>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-purple-400 underline underline-offset-2 hover:text-purple-300 transition-colors"
                    >
                      {EMAIL}
                    </a>
                  </li>
                  <li>
                    <span className="text-gray-400">WhatsApp: </span>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 underline underline-offset-2 hover:text-purple-300 transition-colors"
                    >
                      {WHATSAPP_NUMBER}
                    </a>
                  </li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
