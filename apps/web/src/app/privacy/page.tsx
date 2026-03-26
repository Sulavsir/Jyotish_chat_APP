import { Shield } from 'lucide-react';
import { Card, CardContent } from '@jyotish/ui/card';
import { Navbar } from '@/components/ui';
import { Footer } from '@/components/home/Footer';

const LAST_UPDATED = 'March 25, 2026';
const APP_NAME = 'Chat Jyotish';
const COMPANY_NAME = 'Chat Jyotish';
const EMAIL = 'chatjyotishiofficial@gmail.com';
const WHATSAPP_NUMBER = '9706732691';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black relative">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-24">
        <div className="space-y-8 max-w-3xl mx-auto pb-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-sm text-purple-400 font-medium mb-1">Privacy Policy for {APP_NAME}</p>
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-400 text-lg">Last updated: {LAST_UPDATED}</p>
          </div>

          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardContent className="p-6 sm:p-8 space-y-8 text-gray-300 text-sm leading-relaxed">
              <section className="space-y-3">
                <p>
                  This Privacy Policy describes Our policies and procedures on the collection, use
                  and disclosure of Your information when You use the Service and tells You about
                  Your privacy rights and how the law protects You.
                </p>
                <p>
                  We use Your Personal Data to provide and improve the Service. By using the
                  Service, You agree to the collection and use of information in accordance with
                  this Privacy Policy. This Privacy Policy has been created with the help of the
                  TermsFeed Privacy Policy Generator.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Interpretation and Definitions</h2>
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Interpretation</h3>
                  <p>
                    The words whose initial letters are capitalized have meanings defined under the
                    following conditions. The following definitions shall have the same meaning
                    regardless of whether they appear in singular or in plural.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Definitions</h3>
                  <p>For the purposes of this Privacy Policy:</p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>
                      <strong className="text-gray-200">Account</strong> means a unique account
                      created for You to access our Service or parts of our Service.
                    </li>
                    <li>
                      <strong className="text-gray-200">Affiliate</strong> means an entity that
                      controls, is controlled by, or is under common control with a party, where
                      &quot;control&quot; means ownership of 50% or more of the shares, equity
                      interest or other securities entitled to vote for election of directors or
                      other managing authority.
                    </li>
                    <li>
                      <strong className="text-gray-200">Application</strong> refers to {APP_NAME},
                      the software program provided by the Company.
                    </li>
                    <li>
                      <strong className="text-gray-200">Company</strong> (referred to as either
                      &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in
                      this Privacy Policy) refers to {COMPANY_NAME}.
                    </li>
                    <li>
                      <strong className="text-gray-200">Country</strong> refers to: Nepal
                    </li>
                    <li>
                      <strong className="text-gray-200">Device</strong> means any device that can
                      access the Service such as a computer, a cell phone or a digital tablet.
                    </li>
                    <li>
                      <strong className="text-gray-200">Personal Data</strong> (or &quot;Personal
                      Information&quot;) is any information that relates to an identified or
                      identifiable individual.
                    </li>
                    <li>
                      We use &quot;Personal Data&quot; and &quot;Personal Information&quot;
                      interchangeably unless a law uses a specific term.
                    </li>
                    <li>
                      <strong className="text-gray-200">Service</strong> refers to the Application.
                    </li>
                    <li>
                      <strong className="text-gray-200">Service Provider</strong> means any natural
                      or legal person who processes the data on behalf of the Company. It refers to
                      third-party companies or individuals employed by the Company to facilitate the
                      Service, to provide the Service on behalf of the Company, to perform services
                      related to the Service or to assist the Company in analyzing how the Service
                      is used.
                    </li>
                    <li>
                      <strong className="text-gray-200">Usage Data</strong> refers to data collected
                      automatically, either generated by the use of the Service or from the Service
                      infrastructure itself (for example, the duration of a page visit).
                    </li>
                    <li>
                      <strong className="text-gray-200">You</strong> means the individual accessing
                      or using the Service, or the company, or other legal entity on behalf of
                      which such individual is accessing or using the Service, as applicable.
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Collecting and Using Your Personal Data</h2>
                <h3 className="text-white font-medium">Types of Data Collected</h3>
                <h4 className="text-gray-200 font-medium text-base">Personal Data</h4>
                <p>
                  While using Our Service, We may ask You to provide Us with certain personally
                  identifiable information that can be used to contact or identify You. Personally
                  identifiable information may include, but is not limited to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email address</li>
                  <li>First name and last name</li>
                  <li>Phone number</li>
                </ul>
                <h4 className="text-gray-200 font-medium text-base pt-2">Usage Data</h4>
                <p>Usage Data is collected automatically when using the Service.</p>
                <p>
                  Usage Data may include information such as Your Device&apos;s Internet Protocol
                  address (e.g. IP address), browser type, browser version, the pages of our Service
                  that You visit, the time and date of Your visit, the time spent on those pages,
                  unique device identifiers and other diagnostic data.
                </p>
                <p>
                  When You access the Service by or through a mobile device, We may collect certain
                  information automatically, including, but not limited to, the type of mobile device
                  You use, Your mobile device&apos;s unique ID, the IP address of Your mobile
                  device, Your mobile operating system, the type of mobile Internet browser You
                  use, unique device identifiers and other diagnostic data.
                </p>
                <p>
                  We may also collect information that Your browser sends whenever You visit Our
                  Service or when You access the Service by or through a mobile device.
                </p>
                <h4 className="text-gray-200 font-medium text-base pt-2">
                  Information Collected while Using the Application
                </h4>
                <p>
                  While using Our Application, in order to provide features of Our Application, We may
                  collect, with Your prior permission:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pictures and other information from your Device&apos;s camera and photo library</li>
                </ul>
                <p>
                  We use this information to provide features of Our Service, to improve and
                  customize Our Service. The information may be uploaded to the Company&apos;s
                  servers and/or a Service Provider&apos;s server or it may be simply stored on
                  Your device.
                </p>
                <p>
                  You can enable or disable access to this information at any time, through Your
                  Device settings.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Use of Your Personal Data</h2>
                <p>The Company may use Personal Data for the following purposes:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    To provide and maintain our Service, including to monitor the usage of our
                    Service.
                  </li>
                  <li>
                    To manage Your Account: to manage Your registration as a user of the Service. The
                    Personal Data You provide can give You access to different functionalities of
                    the Service that are available to You as a registered user.
                  </li>
                  <li>
                    For the performance of a contract: the development, compliance and undertaking of
                    the purchase contract for the products, items or services You have purchased or
                    of any other contract with Us through the Service.
                  </li>
                  <li>
                    To contact You: To contact You by email, telephone calls, SMS, or other
                    equivalent forms of electronic communication, such as a mobile
                    application&apos;s push notifications regarding updates or informative
                    communications related to the functionalities, products or contracted services,
                    including the security updates, when necessary or reasonable for their
                    implementation.
                  </li>
                  <li>
                    To provide You with news, special offers, and general information about other
                    goods, services and events which We offer that are similar to those that you
                    have already purchased or inquired about unless You have opted not to receive
                    such information.
                  </li>
                  <li>
                    To manage Your requests: To attend and manage Your requests to Us.
                  </li>
                  <li>
                    For business transfers: We may use Your Personal Data to evaluate or conduct a
                    merger, divestiture, restructuring, reorganization, dissolution, or other sale
                    or transfer of some or all of Our assets, whether as a going concern or as part
                    of bankruptcy, liquidation, or similar proceeding, in which Personal Data held
                    by Us about our Service users is among the assets transferred.
                  </li>
                  <li>
                    For other purposes: We may use Your information for other purposes, such as data
                    analysis, identifying usage trends, determining the effectiveness of our
                    promotional campaigns and to evaluate and improve our Service, products,
                    services, marketing and your experience.
                  </li>
                </ul>
                <p>We may share Your Personal Data in the following situations:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-200">With Service Providers:</strong> We may
                    share Your Personal Data with Service Providers to monitor and analyze the use
                    of our Service, to contact You.
                  </li>
                  <li>
                    <strong className="text-gray-200">For business transfers:</strong> We may share
                    or transfer Your Personal Data in connection with, or during negotiations of,
                    any merger, sale of Company assets, financing, or acquisition of all or a
                    portion of Our business to another company.
                  </li>
                  <li>
                    <strong className="text-gray-200">With Affiliates:</strong> We may share Your
                    Personal Data with Our affiliates, in which case we will require those
                    affiliates to honor this Privacy Policy. Affiliates include Our parent company
                    and any other subsidiaries, joint venture partners or other companies that We
                    control or that are under common control with Us.
                  </li>
                  <li>
                    <strong className="text-gray-200">With business partners:</strong> We may share
                    Your Personal Data with Our business partners to offer You certain products,
                    services or promotions.
                  </li>
                  <li>
                    <strong className="text-gray-200">With other users:</strong> If Our Service
                    offers public areas, when You share Personal Data or otherwise interact in the
                    public areas with other users, such information may be viewed by all users and
                    may be publicly distributed outside.
                  </li>
                  <li>
                    <strong className="text-gray-200">With Your consent:</strong> We may disclose
                    Your Personal Data for any other purpose with Your consent.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Retention of Your Personal Data</h2>
                <p>
                  The Company will retain Your Personal Data only for as long as is necessary for the
                  purposes set out in this Privacy Policy. We will retain and use Your Personal Data
                  to the extent necessary to comply with our legal obligations (for example, if We
                  are required to retain Your data to comply with applicable laws), resolve
                  disputes, and enforce our legal agreements and policies.
                </p>
                <p>
                  Where possible, We apply shorter retention periods and/or reduce identifiability by
                  deleting, aggregating, or anonymizing data. Unless otherwise stated, the retention
                  periods below are maximum periods (&quot;up to&quot;) and We may delete or
                  anonymize data sooner when it is no longer needed for the relevant purpose. We
                  apply different retention periods to different categories of Personal Data based on
                  the purpose of processing and legal obligations:
                </p>
                <h3 className="text-white font-medium">Account Information</h3>
                <p>
                  <strong className="text-gray-200">User Accounts:</strong> retained for the duration
                  of your account relationship plus up to 24 months after account closure to handle
                  any post-termination issues or resolve disputes.
                </p>
                <h3 className="text-white font-medium">Customer Support Data</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Support tickets and correspondence: up to 24 months from the date of ticket
                    closure to resolve follow-up inquiries, track service quality, and defend
                    against potential legal claims
                  </li>
                  <li>
                    Chat transcripts: up to 24 months for quality assurance and staff training
                    purposes.
                  </li>
                </ul>
                <h3 className="text-white font-medium">Usage Data</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Application usage statistics: up to 24 months to understand feature adoption and
                    service improvements.
                  </li>
                  <li>
                    Server logs (IP addresses, access times): up to 24 months for security
                    monitoring and troubleshooting purposes.
                  </li>
                </ul>
                <p>
                  Usage Data is retained in accordance with the retention periods described above,
                  and may be retained longer only where necessary for security, fraud prevention, or
                  legal compliance.
                </p>
                <p>We may retain Personal Data beyond the periods stated above for different reasons:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong className="text-gray-200">Legal obligation:</strong> We are required by
                    law to retain specific data (e.g., financial records for tax authorities).
                  </li>
                  <li>
                    <strong className="text-gray-200">Legal claims:</strong> Data is necessary to
                    establish, exercise, or defend legal claims.
                  </li>
                  <li>
                    <strong className="text-gray-200">Your explicit request:</strong> You ask Us to
                    retain specific information.
                  </li>
                  <li>
                    <strong className="text-gray-200">Technical limitations:</strong> Data exists
                    in backup systems that are scheduled for routine deletion.
                  </li>
                </ul>
                <p>
                  You may request information about how long We will retain Your Personal Data by
                  contacting Us.
                </p>
                <p>
                  When retention periods expire, We securely delete or anonymize Personal Data
                  according to the following procedures:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-gray-200">Deletion:</strong> Personal Data is removed from
                    Our systems and no longer actively processed.
                  </li>
                  <li>
                    <strong className="text-gray-200">Backup retention:</strong> Residual copies may
                    remain in encrypted backups for a limited period consistent with our backup
                    retention schedule and are not restored except where necessary for security,
                    disaster recovery, or legal compliance.
                  </li>
                  <li>
                    <strong className="text-gray-200">Anonymization:</strong> In some cases, We
                    convert Personal Data into anonymous statistical data that cannot be linked back
                    to You. This anonymized data may be retained indefinitely for research and
                    analytics.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Transfer of Your Personal Data</h2>
                <p>
                  Your information, including Personal Data, is processed at the Company&apos;s
                  operating offices and in any other places where the parties involved in the
                  processing are located. It means that this information may be transferred to — and
                  maintained on — computers located outside of Your state, province, country or other
                  governmental jurisdiction where the data protection laws may differ from those from
                  Your jurisdiction.
                </p>
                <p>
                  Where required by applicable law, We will ensure that international transfers of
                  Your Personal Data are subject to appropriate safeguards and supplementary
                  measures where appropriate. The Company will take all steps reasonably necessary to
                  ensure that Your data is treated securely and in accordance with this Privacy
                  Policy and no transfer of Your Personal Data will take place to an organization or
                  a country unless there are adequate controls in place including the security of
                  Your data and other personal information.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Delete Your Personal Data</h2>
                <p>
                  You have the right to delete or request that We assist in deleting the Personal
                  Data that We have collected about You.
                </p>
                <p>
                  Our Service may give You the ability to delete certain information about You from
                  within the Service.
                </p>
                <p>
                  You may update, amend, or delete Your information at any time by signing in to Your
                  Account, if you have one, and visiting the account settings section that allows you
                  to manage Your personal information. You may also contact Us to request access to,
                  correct, or delete any Personal Data that You have provided to Us.
                </p>
                <p>
                  Please note, however, that We may need to retain certain information when we have a
                  legal obligation or lawful basis to do so.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Disclosure of Your Personal Data</h2>
                <h3 className="text-white font-medium">Business Transactions</h3>
                <p>
                  If the Company is involved in a merger, acquisition or asset sale, Your Personal
                  Data may be transferred. We will provide notice before Your Personal Data is
                  transferred and becomes subject to a different Privacy Policy.
                </p>
                <h3 className="text-white font-medium">Law enforcement</h3>
                <p>
                  Under certain circumstances, the Company may be required to disclose Your Personal
                  Data if required to do so by law or in response to valid requests by public
                  authorities (e.g. a court or a government agency).
                </p>
                <h3 className="text-white font-medium">Other legal requirements</h3>
                <p>
                  The Company may disclose Your Personal Data in the good faith belief that such
                  action is necessary to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Comply with a legal obligation</li>
                  <li>Protect and defend the rights or property of the Company</li>
                  <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
                  <li>Protect the personal safety of Users of the Service or the public</li>
                  <li>Protect against legal liability</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Security of Your Personal Data</h2>
                <p>
                  The security of Your Personal Data is important to Us, but remember that no method
                  of transmission over the Internet, or method of electronic storage is 100% secure.
                  While We strive to use commercially reasonable means to protect Your Personal Data,
                  We cannot guarantee its absolute security.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Children&apos;s Privacy</h2>
                <p>
                  Our Service does not address anyone under the age of 16. We do not knowingly
                  collect personally identifiable information from anyone under the age of 16. If You
                  are a parent or guardian and You are aware that Your child has provided Us with
                  Personal Data, please contact Us. If We become aware that We have collected Personal
                  Data from anyone under the age of 16 without verification of parental consent, We
                  take steps to remove that information from Our servers.
                </p>
                <p>
                  If We need to rely on consent as a legal basis for processing Your information and
                  Your country requires consent from a parent, We may require Your parent&apos;s
                  consent before We collect and use that information.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Links to Other Websites</h2>
                <p>
                  Our Service may contain links to other websites that are not operated by Us. If You
                  click on a third party link, You will be directed to that third party&apos;s site.
                  We strongly advise You to review the Privacy Policy of every site You visit.
                </p>
                <p>
                  We have no control over and assume no responsibility for the content, privacy
                  policies or practices of any third party sites or services.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-white font-semibold text-xl">Changes to this Privacy Policy</h2>
                <p>
                  We may update Our Privacy Policy from time to time. We will notify You of any
                  changes by posting the new Privacy Policy on this page.
                </p>
                <p>
                  We will let You know via email and/or a prominent notice on Our Service, prior to
                  the change becoming effective and update the &quot;Last updated&quot; date at the
                  top of this Privacy Policy.
                </p>
                <p>
                  You are advised to review this Privacy Policy periodically for any changes. Changes
                  to this Privacy Policy are effective when they are posted on this page.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-white font-semibold text-xl">Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, You can contact us:</p>
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
