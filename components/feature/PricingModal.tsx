"use client";

import { useState } from "react";
import { X, Check, ArrowRight, Sparkles, Zap, GraduationCap, Crown } from "lucide-react";
import { TIER_PERMISSIONS } from "@/lib/tiers";
import { UserTier } from "@/types";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: UserTier;
}

export function PricingModal({ isOpen, onClose, currentTier }: PricingModalProps) {
  const [loadingTier, setLoadingTier] = useState<UserTier | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (tier: UserTier) => {
    setLoadingTier(tier);
    try {
      const response = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const tiers = [
    {
      id: "student" as UserTier,
      name: "Student",
      price: "₹199",
      description: "Perfect for high school board preparation.",
      icon: <GraduationCap className="h-6 w-6 text-blue-400" />,
      features: [
        "Full Subject Explanations",
        "Assignment Generation",
        "PDF Downloads",
        "Hinglish Support",
        "Unlimited Generations",
      ],
      color: "from-blue-500/20 to-indigo-500/20",
    },
    {
      id: "achiever" as UserTier,
      name: "Achiever",
      price: "₹499",
      description: "Best for JEE/NEET competitive aspirants.",
      icon: <Zap className="h-6 w-6 text-amber-400" />,
      features: [
        "Everything in Student",
        "Chat with Adhyapak (AI Tutor)",
        "Spaced Repetition Flashcards",
        "Performance Analytics",
        "Full Mock Tests",
      ],
      color: "from-amber-500/20 to-orange-500/20",
      popular: true,
    },
    {
      id: "elite" as UserTier,
      name: "Elite Sanctum",
      price: "₹999",
      description: "The ultimate edge for top rankers.",
      icon: <Crown className="h-6 w-6 text-purple-400" />,
      features: [
        "Everything in Achiever",
        "Personalized Learning Paths",
        "Priority AI Processing",
        "Handwritten Note Extraction",
        "Early Access to Features",
      ],
      color: "from-purple-500/20 to-pink-500/20",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0B0F17] border border-slate-800 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        <div className="p-8 md:p-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-6 tracking-wider uppercase">
            <Sparkles className="h-3 w-3" />
            Empower Your Learning
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Beta Launch Offer</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            All premium features are currently **FREE** for all users during our initial launch phase. Experience the full power of VidyaBot!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div 
                key={t.id}
                className={`relative flex flex-col p-8 rounded-3xl border ${t.popular ? 'border-primary ring-1 ring-primary/50' : 'border-slate-800'} bg-gradient-to-b ${t.color} text-left transition-transform hover:scale-[1.02] duration-300`}
              >
                {t.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-[10px] font-black tracking-widest uppercase">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">{t.icon}</div>
                <h3 className="text-xl font-bold text-white mb-1">{t.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">{t.price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  {t.description}
                </p>

                <div className="flex-1 space-y-4 mb-10">
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 p-0.5 rounded-full bg-green-500/20">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-sm text-slate-300 leading-tight">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={currentTier === t.id || loadingTier !== null}
                  onClick={() => handleUpgrade(t.id)}
                  className={`group relative flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold transition-all ${
                    currentTier === t.id 
                    ? 'bg-slate-800 text-slate-500 cursor-default' 
                    : t.popular 
                      ? 'bg-primary text-white hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' 
                      : 'bg-white text-black hover:bg-slate-100'
                  }`}
                >
                  {loadingTier === t.id ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : currentTier === t.id ? (
                    "Active Plan"
                  ) : (
                    <>
                      Upgrade Now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="mt-12 text-slate-500 text-xs">
            Cancel anytime. Payments processed securely via Dodo Payments. 
            All taxes included for Indian customers.
          </p>
        </div>
      </div>
    </div>
  );
}
