/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  GraduationCap, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Tv,
  Layers,
  X
} from 'lucide-react';
import { AppView, UserSettings } from '../types';

interface SidebarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenSettings: () => void;
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
  userSettings,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const primaryNavItems: NavItem[] = [
    {
      view: AppView.FEED,
      label: 'Explore Reels',
      shortLabel: 'Feed',
      icon: Tv,
    },
    {
      view: AppView.COMPOSER,
      label: 'Canvas Composer',
      shortLabel: 'Composer',
      icon: Sparkles,
      badge: 'Studio',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      gradient: true,
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
    {
      view: AppView.COURSE,
      label: 'AI Masterclass',
      shortLabel: 'Learn',
      icon: GraduationCap,
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
        {/* Top Branding */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
          <div 
            className={`flex items-center gap-2.5 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
            onClick={() => handleItemClick(AppView.FEED)}
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-900/40 shrink-0">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <h1 className="font-bogle text-lg text-white font-bold tracking-wide leading-none truncate">
                  Reels Creator
                </h1>
                <span className="text-[9px] text-white/40 tracking-widest uppercase font-semibold">
                  AI Video Studio
                </span>
              </div>
            )}
          </div>

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
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSettings}
              className={`flex-1 flex items-center gap-2 py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/80 hover:text-white transition-all text-xs font-semibold ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
              title="Creator Settings (API Keys, Audio, Models)"
            >
              <Settings className="w-4 h-4 text-purple-300 group-hover:rotate-45 transition-transform" />
              {!isCollapsed && <span>Settings</span>}
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/60 hover:text-white transition-all"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
