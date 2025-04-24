import { useState } from "react";
import NotificationsDialog from "./NotificationsDialog";
import SettingsDialog from "./SettingsDialog";
import ProfileDialog from "./ProfileDialog";
import newLogo from "../assets/logo.png";
import { useAuth } from "@/hooks/use-auth";
import useNotifications from "@/hooks/useNotifications";
import { useLocation } from "wouter";

export default function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [, navigate] = useLocation();

  return (
    <header className="bg-primary/80 backdrop-blur-md text-white shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center bg-white/80 backdrop-blur-md rounded-lg px-3 py-2 shadow-md">
          <img src={newLogo} alt="Logo Mon Suivi Vert" className="h-14 w-auto filter contrast-125 brightness-110 drop-shadow-md" />
        </div>
        <div className="flex space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 ease-in-out relative"
            onClick={() => setNotificationsOpen(true)}
            title="Notifications"
          >
            <span className="material-icons">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 ease-in-out"
            onClick={() => setSettingsOpen(true)}
            title="Paramètres"
          >
            <span className="material-icons">settings</span>
          </button>
          <button 
            className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 ease-in-out"
            onClick={() => setProfileOpen(true)}
            title="Mon profil"
          >
            <span className="material-icons">person</span>
            {user?.firstName && <span className="text-xs ml-1">{user.firstName}</span>}
          </button>
        </div>
      </div>

      {/* Dialogues */}
      <NotificationsDialog 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onLogout={() => navigate('/auth')}
      />
    </header>
  );
}