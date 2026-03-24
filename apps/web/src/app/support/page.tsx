'use client';

import { Mail, MessageCircle, ExternalLink, Globe, Clock, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@jyotish/ui';
import { Navbar } from '@/components/ui';

const WHATSAPP_NUMBER = '9706732691';
const EMAIL = 'chatjyotishiofficial@gmail.com';

const faqs = [
  {
    q: 'How do I add coins to my account?',
    a: 'Go to the Pricing page, select a coin pack, and complete the payment. Your balance will be updated instantly after a successful transaction.',
  },
  {
    q: 'How does broadcast chat work?',
    a: 'When you publish a question to all Jyotish, all available astrologers receive your query. The first astrologer to accept your request will be connected to you in a chat.',
  },
  {
    q: 'Why was my payment not reflected?',
    a: 'Payments may take up to 5 minutes to reflect due to processing delays. If the balance is still not updated after that, please contact us via WhatsApp with your transaction ID.',
  },
  {
    q: 'Can I get a refund?',
    a: 'If a broadcast request expires without being accepted, the coins are automatically refunded to your balance. For other payment issues, contact our support team.',
  },
  {
    q: 'How do I report an astrologer?',
    a: 'Please reach out to us on WhatsApp or email with the astrologer name and a description of the issue. We will investigate promptly.',
  },
];

function SupportContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-10 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4">
          <HelpCircle className="h-8 w-8 text-purple-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Help &amp; Support</h1>
        <p className="text-gray-400 text-lg">We&apos;re here to help. Reach us through any of the channels below.</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-green-500/40 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <MessageCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 mb-0.5">WhatsApp</p>
                <p className="text-white font-semibold text-lg">{WHATSAPP_NUMBER}</p>
                <p className="text-gray-500 text-xs mt-1 mb-3">Fastest response — usually within minutes</p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
                >
                  Open WhatsApp <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/40 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 mb-0.5">Email</p>
                <p className="text-white font-semibold text-base break-all">{EMAIL}</p>
                <p className="text-gray-500 text-xs mt-1 mb-3">For detailed queries &amp; complaints</p>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Send Email <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multilingual Contact Info */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <h2 className="text-white font-semibold text-lg">Contact Details</h2>
          </div>

          <div className="space-y-4 divide-y divide-white/5">
            {/* Nepali */}
            <div className="pt-4 first:pt-0">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">नेपाली</p>
              <p className="text-gray-200 leading-relaxed">
                सहयोगका लागि सम्पर्क गर्नुहोस्:<br />
                <span className="text-green-400 font-medium">WhatsApp: {WHATSAPP_NUMBER}</span><br />
                <span className="text-blue-400 font-medium">Gmail: {EMAIL}</span>
              </p>
            </div>

            {/* English */}
            <div className="pt-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">English</p>
              <p className="text-gray-200 leading-relaxed">
                For support, please contact:<br />
                <span className="text-green-400 font-medium">WhatsApp: {WHATSAPP_NUMBER}</span><br />
                <span className="text-blue-400 font-medium">Gmail: {EMAIL}</span>
              </p>
            </div>

            {/* Hindi */}
            <div className="pt-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">हिंदी</p>
              <p className="text-gray-200 leading-relaxed">
                सहयोग के लिए संपर्क करें:<br />
                <span className="text-green-400 font-medium">WhatsApp: {WHATSAPP_NUMBER}</span><br />
                <span className="text-blue-400 font-medium">Gmail: {EMAIL}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Times */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h2 className="text-white font-semibold text-lg">Response Times</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <MessageCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">WhatsApp</p>
                <p className="text-gray-400 text-xs">Usually within 30 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">Email</p>
                <p className="text-gray-400 text-xs">Within 24 hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-purple-400" />
          <h2 className="text-white font-semibold text-xl">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden">
              <button
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span className="text-white font-medium text-sm">{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="h-4 w-4 text-purple-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Support page - Always uses public layout (Navbar) for both authenticated and unauthenticated users.
 * Same pattern as /horoscopes and /astrologers: one consistent layout regardless of auth state.
 */
export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black relative">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-24">
        <SupportContent />
      </main>
    </div>
  );
}
