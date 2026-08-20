import { resolveUserId } from "./accessControl";

const TOUR_VERSION = "v1";

export const getTourStorageKey = (userId) =>
  `easyplug_admin_tour_${TOUR_VERSION}_${userId || "anon"}`;

export const hasCompletedAppTour = (userId) => {
  try {
    return localStorage.getItem(getTourStorageKey(userId)) === "done";
  } catch {
    return false;
  }
};

export const markAppTourComplete = (userId) => {
  try {
    localStorage.setItem(getTourStorageKey(userId), "done");
  } catch {
    // ignore
  }
};

export const clearAppTourComplete = (userId) => {
  try {
    localStorage.removeItem(getTourStorageKey(userId));
  } catch {
    // ignore
  }
};

/** Shared step ids used as data-tour attributes in Navigation. */
export const TOUR_TARGETS = {
  dashboard: "tour-nav-dashboard",
  inventory: "tour-nav-inventory",
  advertisements: "tour-nav-advertisements",
  messages: "tour-nav-messages",
  reports: "tour-nav-reports",
  users: "tour-nav-users",
  notifications: "tour-nav-notifications",
  profile: "tour-nav-profile",
};

const urlToTourId = {
  "/dashboard": TOUR_TARGETS.dashboard,
  "/inventory": TOUR_TARGETS.inventory,
  "/advertisements": TOUR_TARGETS.advertisements,
  "/messages": TOUR_TARGETS.messages,
  "/reports": TOUR_TARGETS.reports,
  "/userManagement": TOUR_TARGETS.users,
  "/notifications": TOUR_TARGETS.notifications,
};

export const tourIdForNavUrl = (url) => urlToTourId[url] || null;

export function getAppTourSteps({ isSeller = false } = {}) {
  const commonStart = [
    {
      id: "welcome",
      title: "Welcome to EasyPlug",
      body: "Take a quick optional tour of the main areas. You can skip anytime and replay later from your profile.",
      placement: "center",
    },
    ...(isSeller
      ? []
      : [
          {
            id: "dashboard",
            target: TOUR_TARGETS.dashboard,
            title: "Dashboard",
            body: "See an overview of activity, listings, and quick insights for your account.",
            path: "/dashboard",
          },
        ]),
    {
      id: "inventory",
      target: TOUR_TARGETS.inventory,
      title: "My Listings",
      body: "Create and manage the listings you sell on the marketplace.",
      path: "/inventory",
    },
    {
      id: "advertisements",
      target: TOUR_TARGETS.advertisements,
      title: "Advertisements",
      body: "Promote your listings or your website with campaign ads.",
      path: "/advertisements",
    },
    {
      id: "messages",
      target: TOUR_TARGETS.messages,
      title: "Messages",
      body: "Chat with buyers and other users about listings and orders. Open this from the menu — the chat screen is full-page.",
      keepNav: true,
    },
  ];

  const adminOnly = [
    {
      id: "reports",
      target: TOUR_TARGETS.reports,
      title: "Reports",
      body: "Review registrations, sales, and listing activity across the platform.",
      path: "/reports",
      openDrawer: true,
    },
    {
      id: "users",
      target: TOUR_TARGETS.users,
      title: "User Management",
      body: "View and manage admins, listers, and buyers — including account status.",
      path: "/userManagement",
      openDrawer: true,
    },
  ];

  const commonEnd = [
    {
      id: "notifications",
      target: TOUR_TARGETS.notifications,
      title: "Notifications",
      body: "Stay on top of alerts like messages, listing updates, and account events.",
      path: "/notifications",
    },
    {
      id: "profile",
      target: TOUR_TARGETS.profile,
      title: "Your profile",
      body: "Update your account details here. You can also restart this tour from Profile anytime.",
      path: "/profile",
    },
    {
      id: "done",
      title: "You're ready",
      body: "That’s the basics. Explore at your own pace — you can reopen this tour from Profile whenever you need a refresher.",
      placement: "center",
    },
  ];

  if (isSeller) {
    return [...commonStart, ...commonEnd];
  }

  return [
    ...commonStart.slice(0, 2),
    ...adminOnly,
    ...commonStart.slice(2),
    ...commonEnd,
  ];
}

export function resolveTourUserId(profileData) {
  return resolveUserId(profileData);
}
