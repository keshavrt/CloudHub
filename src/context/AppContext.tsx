"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "Admin" | "Photographer" | "Club Member" | "Viewer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  selfieUrl?: string;
  clubName?: string;
}

export interface AlbumRef {
  id: string;
  name: string;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  coverImage: string;
  category: string;
  albums: string[];       // album names for display
  albumRefs: AlbumRef[]; // album id+name for uploads
  totalPhotos: number;
  active: boolean;
  isPrivate: boolean;
  clubName: string;
}

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

export interface FaceAnnotation {
  id: string;
  name: string;
  userId?: string | null;
  // Box coordinates as percentage (0-100)
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MediaItem {
  id: string;
  eventId: string;
  albumName: string;
  url: string;
  fileType: "image" | "video";
  uploadedBy: string;
  uploadedAt: string;
  likes: number;
  likedByMe: boolean;
  favoritedByMe: boolean;
  comments: CommentItem[];
  tags: string[];
  faces: FaceAnnotation[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  events: EventItem[];
  addEvent: (event: Omit<EventItem, "id" | "totalPhotos" | "albumRefs">) => Promise<string | undefined>;
  mediaItems: MediaItem[];
  addMediaItem: (media: Omit<MediaItem, "id" | "likes" | "likedByMe" | "favoritedByMe" | "comments">) => void;
  likeMediaItem: (id: string) => void;
  favoriteMediaItem: (id: string) => void;
  addComment: (mediaId: string, commentText: string) => void;
  shareMediaItem: (id: string) => void;
  notifications: NotificationItem[];
  markNotificationsAsRead: () => void;
  clearNotifications: () => Promise<void>;
  theme: "dark" | "light";
  toggleTheme: () => void;
  registeredSelfie: string | null;
  setRegisteredSelfie: (url: string | null) => void;
  deleteMediaItems: (ids: string[]) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper constant mock data
const INITIAL_EVENTS: EventItem[] = [];
const INITIAL_MEDIA: MediaItem[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [registeredSelfie, setRegisteredSelfie] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load state from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Force clean cache reset on version change
      const currentVersion = localStorage.getItem("em_version");
      if (currentVersion !== "4.0") {
        localStorage.removeItem("em_events");
        localStorage.removeItem("em_mediaItems");
        localStorage.removeItem("em_selfie");
        localStorage.removeItem("em_notifications");
        localStorage.setItem("em_version", "4.0");
      }

      const savedEvents = localStorage.getItem("em_events");
      if (savedEvents) {
        try { setEvents(JSON.parse(savedEvents)); } catch (e) {}
      }
      const savedMedia = localStorage.getItem("em_mediaItems");
      if (savedMedia) {
        try { setMediaItems(JSON.parse(savedMedia)); } catch (e) {}
      }
      const savedTheme = localStorage.getItem("em_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme as "dark" | "light");
      }
      const savedSelfie = localStorage.getItem("em_selfie");
      if (savedSelfie) {
        setRegisteredSelfie(savedSelfie);
      }
      setIsMounted(true);
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("em_events", JSON.stringify(events));
    }
  }, [events, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("em_mediaItems", JSON.stringify(mediaItems));
    }
  }, [mediaItems, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("em_theme", theme);
    }
  }, [theme, isMounted]);

  // Sync registeredSelfie state with the logged-in user's profile selfieUrl
  useEffect(() => {
    if (isMounted) {
      setRegisteredSelfie(currentUser?.selfieUrl || null);
    }
  }, [currentUser, isMounted]);

  // Sync theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Restore backend session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const roleMap: Record<string, UserRole> = {
            ADMIN: "Admin",
            PHOTOGRAPHER: "Photographer",
            CLUB_MEMBER: "Club Member",
            VIEWER: "Viewer",
          };
          setCurrentUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: roleMap[data.user.role] || "Viewer",
            avatarUrl: data.user.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=avatar",
            selfieUrl: data.user.selfieUrl || undefined,
          });
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
        setCurrentUser(null);
      }
    };
    restoreSession();
  }, []);

  // Wrap in useCallback so the polling interval always gets a fresh closure
  // (fixes stale capture of currentUser which caused notifications to never load)
  const fetchBackendData = useCallback(async () => {
    try {
      // 1. Fetch Events
      const eventsRes = await fetch("/api/events", { cache: "no-store" });
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const mappedEvents = eventsData.events.map((e: any) => ({
          id: e.id,
          name: e.name,
          date: new Date(e.date).toISOString().split('T')[0],
          location: e.location || 'N/A',
          description: e.description || '',
          coverImage: e.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
          category: e.category,
          albums: e.albums?.map((alb: any) => alb.name) || ['General'],
          albumRefs: e.albums?.map((alb: any) => ({ id: alb.id, name: alb.name })) || [],
          totalPhotos: e._count?.media || 0,
          active: true,
          isPrivate: e.isPrivate,
          clubName: e.clubName || ""
        }));
        setEvents(mappedEvents);
      }

      // 2. Fetch Media
      const mediaRes = await fetch("/api/media", { cache: "no-store" });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMediaItems(mediaData.media);
      }

      // 3. Fetch Notifications — only if logged in
      if (currentUser) {
        const notifRes = await fetch("/api/notifications", { cache: "no-store" });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          const mappedNotifs = notifData.notifications.map((n: any) => ({
            id: n.id,
            title: n.type === 'like' ? '❤️ New Like' : n.type === 'comment' ? '💬 New Comment' : n.type === 'tag' ? '🏷️ You were tagged' : 'Notification',
            message: n.message,
            time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: n.isRead,
            type: n.type === 'tag' ? 'success' : 'info'
          }));
          setNotifications(mappedNotifs);
        }
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to load backend data:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Poll backend every 5s. fetchBackendData is stable per-currentUser (useCallback),
  // so the interval always uses a fresh closure with the right user context.
  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  const addEvent = async (newEvent: Omit<EventItem, "id" | "totalPhotos" | "albumRefs">) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEvent.name,
          description: newEvent.description,
          category: newEvent.category,
          date: newEvent.date,
          location: newEvent.location,
          isPrivate: newEvent.isPrivate,
          coverImage: newEvent.coverImage,
          clubName: newEvent.clubName
        })
      });
      if (res.ok) {
        const data = await res.json();
        const eventId = data.event.id;
        // Create each requested album under the event
        const albumNames = newEvent.albums?.length ? newEvent.albums : ['General'];
        for (const albumName of albumNames) {
          await fetch(`/api/events/${eventId}/albums`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: albumName.trim() })
          });
        }
        await fetchBackendData();
        return eventId as string;
      } else {
        const errData = await res.json();
        console.error("Event creation failed:", errData.error);
        throw new Error(errData.error || "Failed to create event");
      }
    } catch (err) {
      console.error("Failed to create event:", err);
      throw err;
    }
  };

  const addMediaItem = (newMedia: Omit<MediaItem, "id" | "likes" | "likedByMe" | "favoritedByMe" | "comments">) => {
    fetchBackendData();
  };

  const likeMediaItem = async (id: string) => {
    // Optimistic update — flip likedByMe and adjust count immediately
    setMediaItems(prev => prev.map(m => {
      if (m.id !== id) return m;
      const nowLiked = !m.likedByMe;
      return { ...m, likedByMe: nowLiked, likes: nowLiked ? m.likes + 1 : m.likes - 1 };
    }));

    try {
      const res = await fetch(`/api/media/${id}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" })
      });
      if (res.ok) {
        // Sync with real backend state after the optimistic update
        await fetchBackendData();
      } else {
        // Revert optimistic update on failure
        await fetchBackendData();
      }
    } catch (err) {
      console.error("Failed to toggle like on backend:", err);
      await fetchBackendData(); // revert on error
    }
  };

  const addComment = async (mediaId: string, commentText: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/media/${mediaId}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", content: commentText })
      });
      if (res.ok) {
        await fetchBackendData();
      }
    } catch (err) {
      console.error("Failed to post comment on backend:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        await fetchBackendData();
      }
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const clearNotifications = async () => {
    // Optimistically clear UI immediately
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear notifications from DB:", err);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const deleteMediaItems = (ids: string[]) => {
    fetchBackendData();
  };

  const favoriteMediaItem = async (id: string) => {
    // Optimistic toggle
    setMediaItems(prev => prev.map(m => {
      if (m.id !== id) return m;
      return { ...m, favoritedByMe: !m.favoritedByMe };
    }));
    try {
      await fetch(`/api/media/${id}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "favorite" })
      });
      await fetchBackendData();
    } catch (err) {
      console.error("Failed to toggle favourite:", err);
      await fetchBackendData();
    }
  };

  const shareMediaItem = (id: string) => {
    const url = `${window.location.origin}/media/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Brief toast notification — use a custom event so any listener can pick it up
      window.dispatchEvent(new CustomEvent("em:toast", { detail: { message: "Share link copied to clipboard!" } }));
    });
  };

  const setSelfieWrapper = (url: string | null) => {
    setRegisteredSelfie(url);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        selfieUrl: url || undefined
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        events,
        addEvent,
        mediaItems,
        addMediaItem,
        likeMediaItem,
        favoriteMediaItem,
        addComment,
        shareMediaItem,
        notifications,
        markNotificationsAsRead,
        clearNotifications,
        theme,
        toggleTheme,
        registeredSelfie,
        setRegisteredSelfie: setSelfieWrapper,
        deleteMediaItems,
        refreshData: fetchBackendData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};
