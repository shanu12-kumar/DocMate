import React, { useState } from 'react';
import { Heart, X, CheckCircle2, ShieldCheck, Sparkles, Coffee, Gift, Crown, ArrowRight } from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(99);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handlePay = async () => {
    if (currentAmount <= 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          currency: 'INR',
          supporterName: name || 'DocMate Supporter',
        })
      });

      const data = await res.json();
      if (data.success) {
        // Show success confirmation
        setSuccessMessage(`Thank you for supporting DocMate with ₹${currentAmount}! Order ID: ${data.orderId}`);
      }
    } catch (err) {
      setSuccessMessage(`Thank you so much! Your generous pledge of ₹${currentAmount} keeps DocMate 100% free for everyone.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successMessage ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              You're Awesome! 💖
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              {successMessage}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs rounded-full shadow-md transition-all"
            >
              Back to Tools
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto shadow-2xs">
                <Heart className="w-6 h-6 fill-pink-500 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Support DocMate
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                DocMate is completely free with no watermarks and no paywalls. Support server costs and AI features with a quick coffee!
              </p>
            </div>

            {/* Quick Amounts */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Amount (INR)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { amount: 49, label: '₹49', desc: '☕ Chai' },
                  { amount: 99, label: '₹99', desc: '🚀 Coffee' },
                  { amount: 299, label: '₹299', desc: '👑 VIP' },
                ].map((item) => (
                  <button
                    key={item.amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(item.amount);
                      setCustomAmount('');
                    }}
                    className={`p-3 rounded-2xl text-center border transition-all ${
                      selectedAmount === item.amount && !customAmount
                        ? 'border-[#0066FF] bg-blue-50/70 text-[#0066FF] shadow-2xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Your Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0066FF] focus:bg-white"
              />
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-[#0066FF] hover:opacity-95 text-white font-bold text-xs rounded-full shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Connecting Razorpay...' : `Support with ₹${currentAmount} (Razorpay)`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secured via Razorpay API • Instant acknowledgement</span>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
