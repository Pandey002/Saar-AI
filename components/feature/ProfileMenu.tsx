import { useEffect, useState } from "react";
import { User, RefreshCcw, Moon, UserCircle, LogOut, LogIn, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { Tooltip } from "@/components/ui/Tooltip";
import { createClient } from "@/lib/supabase/client";

interface ProfileMenuProps {
  onResetWorkspace: () => void;
}

export function ProfileMenu({ onResetWorkspace }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <Tooltip content="Account & Settings">
      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        trigger={
          <button 
            type="button" 
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none"
          >
            <User className="h-5 w-5" />
          </button>
        }
      >
        <div className="px-3 pb-2 pt-2">
          <p className="text-[13px] font-bold text-slate-900 truncate max-w-[180px]">
            {userEmail ?? "Guest User"}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mt-0.5">
            {userEmail ? "Pro Tier" : "Free Tier"}
          </p>
        </div>
        
        <div className="my-1 h-px bg-slate-100" />
        
        <DropdownItem 
          onClick={() => {
            onResetWorkspace();
            setIsOpen(false);
          }}
        >
          <RefreshCcw className="h-4 w-4 text-slate-500" />
          <span className="text-slate-700">Reset Workspace</span>
        </DropdownItem>
        
        <div className="my-1 h-px bg-slate-100" />
        
        <DropdownItem 
          onClick={() => {
            alert("Account settings coming soon!");
            setIsOpen(false);
          }}
        >
          <UserCircle className="h-4 w-4 text-slate-500" />
          <span className="text-slate-700">Account Settings</span>
        </DropdownItem>

        <div className="my-1 h-px bg-slate-100" />

        {userEmail ? (
          <DropdownItem 
            onClick={handleSignOut}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownItem>
        ) : (
          <DropdownItem 
            onClick={() => window.location.href = "/login"}
            className="text-primary hover:bg-primary/5 hover:text-primary-dark"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Tooltip>
  );
}
