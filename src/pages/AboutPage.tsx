import React, { useState } from 'react';
import { Shield, Zap, Lock, Globe, Heart, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      
      {/* Brand Mission */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-2">
          <Logo variant="vertical" size="lg" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Your Files. Made Simple.
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          DocMate was founded on a simple premise: everyday document and image tasks shouldn't require complex software downloads, sketchy spam-filled websites, or sacrificing your personal privacy.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Zero-Storage Privacy
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We prioritize WebAssembly and client-side processing algorithms so your files never hit remote servers or third-party databases.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Blazing Fast Speed
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No waiting in server queues or uploading gigabytes across slow networks. Processing happens in milliseconds directly on your hardware.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Universal Compatibility
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Works smoothly on mobile phones, tablets, Chromebooks, Windows, and Mac laptops without installing any apps or extensions.
          </p>
        </div>
      </div>

    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Contact Support & Feedback
        </h1>
        <p className="text-slate-600 text-sm">
          Have a question, feature request, or encountered an issue with a file? We're here to help.
        </p>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Message Received!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you for reaching out to DocMate Support. Our engineering team will review your message and reply to {email} shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-6 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-full"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0066FF] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0066FF] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message or Tool Feedback</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or feedback..."
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0066FF] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
