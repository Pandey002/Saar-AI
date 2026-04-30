"use client";

import { Twitter, Linkedin, Link2, Share2 } from "lucide-react";

export function SocialShare({ title, slug }: { title: string, slug: string }) {
  const shareUrl = `https://vidyabot.in/learn/${slug}`;
  const shareText = `I just mastered "${title}" on Vidya! Check out this AI-powered study guide. #Learning #EdTech`;

  return (
    <div className="bg-white border border-sand rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
        <Share2 className="w-4 h-4 text-primary" />
        Share this Guide
      </div>
      <div className="flex flex-wrap gap-2">
        <a 
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1DA1F2] text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Twitter className="w-4 h-4" />
          Tweet
        </a>
        <a 
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0077b5] text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Linkedin className="w-4 h-4" />
          Post
        </a>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          <Link2 className="w-4 h-4" />
          Copy Link
        </button>
      </div>
    </div>
  );
}
