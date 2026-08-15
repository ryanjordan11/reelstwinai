/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Studio Sidebar Navigation
 * Access Creation Suite, Storyboard, AI Avatars, Developer Hub,
 * and Local Activity Inspector with responsive collapse and mobile drawer.
*/

import React from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Wand2, 
  Scissors, 
  Flame, 
  Image as ImageIcon, 
  LayoutGrid, 
  FileText, 
  Search, 
  Settings, 
  User, 
  ChevronLeft, 
  Tv,
  Layers,
  X,
  Code2,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { AppView, UserSettings } from '../types';

interface SidebarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenSettings: () => void;
  onOpenDevHub?: () => void;
  onOpenInspector?: () => void;
  userSettings: UserSettings | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  view: AppView;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  gradient?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenSettings,
  onOpenDevHub,
  onOpenInspector,
  userSettings,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const primaryNavItems: NavItem[] = [
    {
      view: AppView.COMPOSER,
      label: 'AI Composer',
      shortLabel: 'Composer',
      icon: Sparkles,
      badge: 'Create',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      gradient: true,
    },
    {
      view: AppView.FEED,
      label: 'Explore Reels',
      shortLabel: 'Feed',
      icon: Tv,
    },
    {
      view: AppView.AVATAR_CREATOR,
      label: 'Avatar Studio',
      shortLabel: 'Avatars',
      icon: Wand2,
      badge: 'Twins',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      view: AppView.EDITOR,
      label: 'Storyboard Editor',
      shortLabel: 'Editor',
      icon: Scissors,
      badge: 'Transitions',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    },
  ];

  const toolsNavItems: NavItem[] = [
    {
      view: AppView.TRENDING,
      label: 'Trending Topics',
      shortLabel: 'Trends',
      icon: Flame,
    },
    {
      view: AppView.COVER_CREATOR,
      label: 'Cover & Thumbnails',
      shortLabel: 'Covers',
      icon: ImageIcon,
    },
    {
      view: AppView.GALLERY,
      label: 'Creation Gallery',
      shortLabel: 'Gallery',
      icon: LayoutGrid,
    },
    {
      view: AppView.SCRIPTS,
      label: 'Viral Script AI',
      shortLabel: 'Scripts',
      icon: FileText,
    },
    {
      view: AppView.ANALYZE,
      label: 'Video Prompt Analyzer',
      shortLabel: 'Analyzer',
      icon: Search,
    },
  ];

  const handleItemClick = (view: AppView) => {
    onSelectView(view);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const renderNavList = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => handleItemClick(item.view)}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
              isActive
                ? item.gradient
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-white text-black shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <div className={`shrink-0 ${isActive ? (item.gradient ? 'text-white' : 'text-black') : 'text-neutral-400 group-hover:text-white'}`}>
              <Icon className="w-4 h-4" />
            </div>

            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${
                      isActive && !item.gradient
                        ? 'bg-black/10 text-black border-black/20'
                        : item.badgeColor || 'bg-white/10 text-white/70 border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            )}

            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-neutral-900 border border-white/15 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0b0b0e] border-r border-white/10 transition-all duration-300 ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Collapse Button */}
        <div className={`h-16 border-b border-white/10 flex items-center justify-between px-3.5 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <div 
            className={`flex items-center gap-2.5 cursor-pointer overflow-hidden group ${isCollapsed ? 'justify-center w-full' : ''}`}
            onClick={isCollapsed ? onToggleCollapse : () => handleItemClick(AppView.FEED)}
            title={isCollapsed ? 'Click to Expand Sidebar' : 'Go to Explore Feed'}
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-900/40 shrink-0 group-hover:scale-105 transition-transform">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bogle text-lg text-white font-bold tracking-wide leading-none truncate">
                    Reels Creator
                  </h1>
                  <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold border border-purple-500/30">
                    MIT
                  </span>
                </div>
                <span className="text-[9px] text-white/40 tracking-widest uppercase font-semibold mt-0.5">
                  Local-First AI Studio
                </span>
              </div>
            )}
          </div>

          {/* Top Collapse Toggle on Desktop */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all items-center justify-center shrink-0 ml-1"
              title="Collapse Sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
          
          {/* Main Studio Tools */}
          <div>
            {!isCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Creation Suite</span>
              </div>
            )}
            {renderNavList(primaryNavItems)}
          </div>

          {/* Secondary Tools */}
          <div>
            {!isCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Studio & Assets</span>
              </div>
            )}
            {renderNavList(toolsNavItems)}
          </div>

          {/* Open Source & Trust Links */}
          <div>
            {!isCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Open Source & Trust</span>
              </div>
            )}
            <div className="space-y-1">
              {onOpenInspector && (
                <button
                  type="button"
                  onClick={onOpenInspector}
                  title={isCollapsed ? "Local Activity Inspector" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all ${
                    isCollapsed ? 'justify-center px-2' : ''
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                      <span className="truncate">Activity Inspector</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20">0 Telemetry</span>
                    </div>
                  )}
                </button>
              )}

              {onOpenDevHub && (
                <button
                  type="button"
                  onClick={onOpenDevHub}
                  title={isCollapsed ? "Developer Hub & Architecture" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all ${
                    isCollapsed ? 'justify-center px-2' : ''
                  }`}
                >
                  <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                  {!isCollapsed && <span className="truncate">Developer Hub</span>}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom User & Settings Dock */}
        <div className="p-3 border-t border-white/10 bg-[#09090b] space-y-2 shrink-0">
          
          {/* Profile Card Button */}
          <button
            type="button"
            onClick={() => handleItemClick(AppView.PROFILE)}
            title={isCollapsed ? 'My Profile' : undefined}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
              currentView === AppView.PROFILE
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/[0.03] border-white/5 text-white/80 hover:bg-white/[0.08] hover:border-white/10'
            } ${isCollapsed ? 'justify-center p-1.5' : ''}`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-white/20 shrink-0 flex items-center justify-center">
              {userSettings?.avatarBase64 ? (
                <img src={userSettings.avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-purple-300" />
              )}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-bold text-white truncate">
                  {userSettings?.displayName || 'Creator Profile'}
                </div>
                <div className="text-[10px] text-white/40 truncate">
                  {userSettings?.niche || 'AI Video Creator'}
                </div>
              </div>
            )}
          </button>

          {/* Quick Settings & Collapse Actions */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/80 hover:text-white transition-all"
                title="Creator Settings (API Keys, Audio, Models, Storage)"
              >
                <Settings className="w-4 h-4 text-purple-300" />
              </button>

              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 hover:text-white transition-all shadow-sm"
                title="Expand Sidebar (Ctrl+B)"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex-1 flex items-center gap-2 py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/80 hover:text-white transition-all text-xs font-semibold"
                title="Creator Settings (API Keys, Audio, Models, Storage)"
              >
                <Settings className="w-4 h-4 text-purple-300 group-hover:rotate-45 transition-transform" />
                <span>Settings</span>
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/60 hover:text-white transition-all"
                title="Collapse Sidebar (Ctrl+B)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
