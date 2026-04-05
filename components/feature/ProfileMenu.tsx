"use client";

import { useState } from "react";
import { User, RefreshCcw, Moon, UserCircle, LogOut } from "lucide-react";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { Tooltip } from "@/components/ui/Tooltip";

interface ProfileMenuProps {
  onResetWorkspace: () => void;
}

export function ProfileMenu({ onResetWorkspace }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          <p className="text-[13px] font-bold text-slate-900">Guest User</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mt-0.5">Free Tier</p>
        </div>
        
        <div className="my-1 h-px bg-slate-100" />
        
        <DropdownItem 
          onClick={() => {
            onResetWorkspace();
            setIsOpen(false);
          }}
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Reset Workspace</span>
        </DropdownItem>
        
        <DropdownItem 
          onClick={() => {
            alert("Theme toggling coming soon!");
            setIsOpen(false);
          }}
        >
          <Moon className="h-4 w-4" />
          <span>Toggle Theme</span>
        </DropdownItem>
        
        <div className="my-1 h-px bg-slate-100" />
        
        <DropdownItem 
          onClick={() => {
            alert("Account settings coming soon!");
            setIsOpen(false);
          }}
        >
          <UserCircle className="h-4 w-4" />
          <span>Account</span>
        </DropdownItem>

        <DropdownItem 
          onClick={() => {
            alert("Authentication coming soon!");
            setIsOpen(false);
          }}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownItem>
      </DropdownMenu>
    </Tooltip>
  );
}
