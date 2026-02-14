import {
  BsBookmarkStarFill,
  BsClockHistory,
  BsGrid3X3GapFill,
  BsPeopleFill,
} from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi";
import { MdRssFeed, MdStorefront, MdVideoLibrary } from "react-icons/md";
import { AiOutlineRobot } from "react-icons/ai";
import {
  Contact,
  MessagesByContact,
  NavItem,
  NotificationItem,
  Post,
  Reel,
  ShortcutItem,
  Story,
} from "./types";

export const navItems: NavItem[] = [
  { id: "meta-ai", label: "Meta AI", icon: AiOutlineRobot },
  { id: "friends", label: "Friends", icon: BsPeopleFill },
  { id: "memories", label: "Memories", icon: BsClockHistory },
  { id: "saved", label: "Saved", icon: BsBookmarkStarFill },
  { id: "groups", label: "Groups", icon: HiUserGroup },
  { id: "reels", label: "Reels", icon: MdVideoLibrary },
  { id: "marketplace", label: "Marketplace", icon: MdStorefront },
  { id: "feeds", label: "Feeds", icon: MdRssFeed },
  { id: "see-more", label: "See more", icon: BsGrid3X3GapFill },
];

export const shortcutItems: ShortcutItem[] = [
  {
    id: "travel",
    label: "Route to Settle in the UK",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "dev",
    label: "Frontend Builders",
    gradient: "from-indigo-500 to-sky-500",
  },
  {
    id: "design",
    label: "Visual Design Hub",
    gradient: "from-pink-500 to-rose-500",
  },
];

export const stories: Story[] = [
  {
    id: "story-1",
    name: "Angela",
    gradient: "from-amber-400 to-rose-500",
    avatarGradient: "from-sky-400 to-blue-600",
  },
  {
    id: "story-2",
    name: "Aabiskar",
    gradient: "from-slate-700 to-slate-900",
    avatarGradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "story-3",
    name: "Avinav",
    gradient: "from-sky-500 to-indigo-500",
    avatarGradient: "from-purple-400 to-indigo-600",
  },
  {
    id: "story-4",
    name: "Sandhya",
    gradient: "from-rose-400 to-red-500",
    avatarGradient: "from-orange-400 to-pink-600",
  },
  {
    id: "story-5",
    name: "Himal",
    gradient: "from-emerald-500 to-lime-500",
    avatarGradient: "from-blue-500 to-cyan-500",
  },
];

export const reels: Reel[] = [
  {
    id: "reel-1",
    title: "City lights in 15s",
    creator: "Sameer",
    gradient: "from-gray-900 via-slate-800 to-slate-900",
  },
  {
    id: "reel-2",
    title: "Cafe hopping",
    creator: "Sangam",
    gradient: "from-yellow-500 via-orange-500 to-rose-500",
  },
  {
    id: "reel-3",
    title: "Mountain ride",
    creator: "Prakriti",
    gradient: "from-emerald-600 via-teal-600 to-sky-700",
  },
];

export const posts: Post[] = [
  {
    id: "post-1",
    author: "Sangam Giri",
    time: "2 hrs",
    content:
      "Reflecting on the last six years. Grateful for the memories and new connections.",
    mediaGradient: "from-sky-500 via-cyan-500 to-blue-600",
    likes: 312,
    comments: 48,
    shares: 12,
    avatarGradient: "from-slate-500 to-slate-800",
  },
  {
    id: "post-2",
    author: "NepAus Entertainment",
    time: "Yesterday",
    content:
      "Wedding celebrations are on! Here’s a sneak peek from the rehearsal party.",
    mediaGradient: "from-rose-500 via-pink-500 to-orange-400",
    likes: 842,
    comments: 129,
    shares: 64,
    avatarGradient: "from-amber-400 to-orange-600",
  },
  {
    id: "post-3",
    author: "Bitter Quotes",
    time: "4 hrs",
    content:
      "“Slow progress is still progress.” Keep going — you’re closer than you think.",
    mediaGradient: "from-slate-900 via-gray-800 to-slate-700",
    likes: 521,
    comments: 33,
    shares: 21,
    avatarGradient: "from-zinc-500 to-zinc-800",
  },
];

export const contacts: Contact[] = [
  {
    id: "contact-1",
    name: "Sangam Giri",
    initials: "SG",
    gradient: "from-slate-400 to-slate-700",
    online: true,
  },
  {
    id: "contact-2",
    name: "Bitter Quotes",
    initials: "BQ",
    gradient: "from-zinc-400 to-zinc-700",
    online: false,
  },
  {
    id: "contact-3",
    name: "Sameer Shahi",
    initials: "SS",
    gradient: "from-indigo-500 to-blue-600",
    online: true,
  },
  {
    id: "contact-4",
    name: "Anju Sharma",
    initials: "AS",
    gradient: "from-rose-400 to-pink-600",
    online: true,
  },
  {
    id: "contact-5",
    name: "Dev Timilsina",
    initials: "DT",
    gradient: "from-amber-400 to-orange-500",
    online: false,
  },
  {
    id: "contact-6",
    name: "Anjan Sresta",
    initials: "AS",
    gradient: "from-emerald-400 to-teal-600",
    online: true,
  },
  {
    id: "contact-7",
    name: "Bishal Bhuzell",
    initials: "BB",
    gradient: "from-sky-400 to-blue-600",
    online: false,
  },
  {
    id: "contact-8",
    name: "Himal Shahi",
    initials: "HS",
    gradient: "from-purple-400 to-indigo-600",
    online: true,
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Sangam Giri",
    description: "tagged you in a post you haven't seen: “Ramailo chhumghat”.",
    time: "4h",
    isUnread: true,
    isNew: true,
    iconGradient: "from-amber-400 to-orange-500",
  },
  {
    id: "notif-2",
    title: "Deepu Gurung",
    description: "invited you to follow NEPAL.",
    time: "10h",
    isUnread: true,
    isNew: true,
    iconGradient: "from-emerald-400 to-teal-600",
    actions: {
      primary: "Accept",
      secondary: "Decline",
    },
  },
  {
    id: "notif-3",
    title: "Story archive",
    description: "Your last story got 71 views before it expired.",
    time: "1w",
    isUnread: false,
    isNew: false,
    iconGradient: "from-sky-400 to-blue-600",
  },
  {
    id: "notif-4",
    title: "Aabiskar Dhungana",
    description: "tagged you in a post: “आज अलि फरक देख्न पाइयो।”",
    time: "1w",
    isUnread: false,
    isNew: false,
    iconGradient: "from-purple-400 to-indigo-600",
  },
  {
    id: "notif-5",
    title: "Sapana Malla",
    description: "tagged you in a post you haven't seen.",
    time: "1w",
    isUnread: false,
    isNew: false,
    iconGradient: "from-rose-400 to-pink-600",
  },
];

export const messagesByContact: MessagesByContact = {
  "contact-1": [
    {
      id: "msg-1",
      from: "contact",
      text: "Hey! Are you joining the meetup later?",
      time: "2:21 PM",
    },
    {
      id: "msg-2",
      from: "self",
      text: "Yes, I’ll be there in about 20 minutes.",
      time: "2:23 PM",
    },
  ],
  "contact-2": [
    {
      id: "msg-3",
      from: "contact",
      text: "“Slow progress is still progress.”",
      time: "11:05 AM",
    },
    {
      id: "msg-4",
      from: "self",
      text: "Needed this today. Thank you!",
      time: "11:06 AM",
    },
  ],
  "contact-3": [
    {
      id: "msg-5",
      from: "contact",
      text: "Meet link: https://meet.google.com/mgc-erxn-naw",
      time: "2:24 PM",
    },
    {
      id: "msg-6",
      from: "self",
      text: "Got it — joining now.",
      time: "2:25 PM",
    },
  ],
  "contact-4": [
    {
      id: "msg-7",
      from: "contact",
      text: "Happy birthday to Mahendra today 🎉",
      time: "9:08 AM",
    },
  ],
  "contact-5": [
    {
      id: "msg-8",
      from: "contact",
      text: "Did you see the new reels?",
      time: "4:48 PM",
    },
    {
      id: "msg-9",
      from: "self",
      text: "Yep! Super inspiring edits.",
      time: "4:52 PM",
    },
  ],
  "contact-6": [
    {
      id: "msg-10",
      from: "contact",
      text: "Can we review the UI later?",
      time: "1:30 PM",
    },
  ],
  "contact-7": [
    {
      id: "msg-11",
      from: "contact",
      text: "Good morning! How are you?",
      time: "8:14 AM",
    },
    {
      id: "msg-12",
      from: "self",
      text: "All good! Hope you are too.",
      time: "8:16 AM",
    },
  ],
  "contact-8": [
    {
      id: "msg-13",
      from: "contact",
      text: "Are we still on for the ride?",
      time: "6:10 PM",
    },
    {
      id: "msg-14",
      from: "self",
      text: "Yes, leaving in 10!",
      time: "6:12 PM",
    },
  ],
};
