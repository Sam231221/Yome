import {
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  FlaskConical,
  Headphones,
  Home,
  MessageCircle,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type YomeTone = "blue" | "teal" | "amber" | "violet" | "neutral";

export type YomeNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const yomeNavItems: YomeNavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Connections", href: "/connections", icon: UserRound },
  { label: "Messages", href: "/chat", icon: MessageCircle, badge: "4" },
  { label: "Study Rooms", href: "/study-rooms", icon: Headphones },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Projects", href: "/projects", icon: FlaskConical },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const groups = [
  {
    id: "python-learners",
    name: "Python Learners",
    about: "Daily practice, debugging help, and beginner-friendly code reviews.",
    symbol: "</>",
    tone: "blue" as YomeTone,
    members: "18.4k",
    level: "Beginner friendly",
    joined: true,
  },
  {
    id: "physics-club",
    name: "Physics Problem Solvers",
    about: "Work through mechanics, quantum ideas, and visual explanations together.",
    symbol: "phi",
    tone: "teal" as YomeTone,
    members: "9.2k",
    level: "Intermediate",
    joined: false,
  },
  {
    id: "robotics-team",
    name: "Robotics Team",
    about: "Arduino, sensors, CAD, and small team build logs.",
    symbol: "ENG",
    tone: "amber" as YomeTone,
    members: "7.8k",
    level: "Project based",
    joined: false,
  },
  {
    id: "calculus-circle",
    name: "Calculus Circle",
    about: "Conceptual math support, visual proofs, and revision sessions.",
    symbol: "SIG",
    tone: "violet" as YomeTone,
    members: "12.1k",
    level: "All levels",
    joined: true,
  },
];

export const topics = [
  { title: "Artificial Intelligence", posts: "2.8k posts", tone: "blue" as YomeTone },
  { title: "Calculus", posts: "1.7k posts", tone: "violet" as YomeTone },
  { title: "Robotics", posts: "1.2k posts", tone: "amber" as YomeTone },
  { title: "Quantum Physics", posts: "940 posts", tone: "teal" as YomeTone },
];

export const feedPosts = [
  {
    id: "integration-by-parts",
    type: "Question",
    author: "Sarah Chen",
    initials: "SC",
    tone: "teal" as YomeTone,
    time: "2h",
    title: "Can someone explain integration by parts intuitively?",
    body: "I understand the formula, but I am struggling to see why it works geometrically. Is there a visual way to think about it?",
    tags: ["Mathematics", "Calculus"],
    stat: "12 helpful",
    detail: "8 answers",
  },
  {
    id: "smart-greenhouse",
    type: "Project",
    author: "Alex Nguyen",
    initials: "AN",
    tone: "amber" as YomeTone,
    time: "5h",
    title: "We built an Arduino smart greenhouse",
    body: "Our four-person team finished a prototype that monitors soil moisture, temperature, and light, then waters plants automatically.",
    tags: ["Engineering", "Programming"],
    stat: "48 inspired",
    detail: "12 comments",
  },
];

export type FeedPost = (typeof feedPosts)[number];

export const studyRooms = [
  {
    id: "python-help",
    title: "Python Help Room",
    meta: "14 studying now",
    symbol: "</>",
    tone: "blue" as YomeTone,
  },
  {
    id: "physics-problem-solving",
    title: "Physics Problem Solving",
    meta: "7 studying now",
    symbol: "phi",
    tone: "teal" as YomeTone,
  },
  {
    id: "calculus-revision",
    title: "Calculus Revision",
    meta: "Scheduled at 4:00 PM",
    symbol: "SIG",
    tone: "violet" as YomeTone,
  },
];

export const resources = [
  {
    id: "calculus-visual-guide",
    title: "Visual Guide to Integration by Parts",
    type: "Guide",
    subject: "Mathematics",
    tone: "violet" as YomeTone,
    summary: "A compact guide with diagrams, examples, and common mistake checks.",
    saves: "2.4k saves",
  },
  {
    id: "python-debugging-checklist",
    title: "Python Debugging Checklist",
    type: "Checklist",
    subject: "Programming",
    tone: "blue" as YomeTone,
    summary: "A practical flow for reading tracebacks and reducing failing cases.",
    saves: "1.8k saves",
  },
  {
    id: "robotics-sensor-primer",
    title: "Sensor Primer for Robotics Teams",
    type: "Workbook",
    subject: "Engineering",
    tone: "amber" as YomeTone,
    summary: "Quick notes on calibration, noise, wiring, and test plans.",
    saves: "960 saves",
  },
];

export const projects = [
  {
    id: "smart-greenhouse",
    title: "Arduino Smart Greenhouse",
    subject: "Engineering",
    team: "4 students",
    progress: "Prototype complete",
    stack: "Arduino, C++",
    tone: "amber" as YomeTone,
    summary: "A sensor-led greenhouse controller with automatic watering and environment tracking.",
  },
  {
    id: "route-optimizer",
    title: "Campus Route Optimizer",
    subject: "Computer Science",
    team: "3 students",
    progress: "Testing",
    stack: "Python, Graphs",
    tone: "blue" as YomeTone,
    summary: "A graph-search project for comparing routes across lectures, labs, and libraries.",
  },
  {
    id: "wave-simulator",
    title: "Wave Interference Simulator",
    subject: "Physics",
    team: "2 students",
    progress: "Design review",
    stack: "React, Canvas",
    tone: "teal" as YomeTone,
    summary: "An interactive simulator for visualizing phase, amplitude, and superposition.",
  },
];

export const events = [
  {
    id: "calculus-revision",
    day: "28",
    month: "AUG",
    title: "Calculus Revision Session",
    meta: "Today at 4:00 PM",
    group: "Mathematics Study Group",
    tone: "violet" as YomeTone,
  },
  {
    id: "machine-learning-intro",
    day: "30",
    month: "AUG",
    title: "Intro to Machine Learning",
    meta: "Saturday at 2:30 PM",
    group: "AI and ML Community",
    tone: "blue" as YomeTone,
  },
  {
    id: "robotics-demo-night",
    day: "02",
    month: "SEP",
    title: "Robotics Demo Night",
    meta: "Wednesday at 6:00 PM",
    group: "Robotics Team",
    tone: "amber" as YomeTone,
  },
];

export const connections = [
  { name: "Priya Sharma", initials: "PS", detail: "AI, Robotics", tone: "violet" as YomeTone },
  { name: "Leo Martins", initials: "LM", detail: "Physics, Astronomy", tone: "teal" as YomeTone },
  { name: "Maya Okafor", initials: "MO", detail: "Data Science", tone: "blue" as YomeTone },
  { name: "Noah Kim", initials: "NK", detail: "Engineering Design", tone: "amber" as YomeTone },
];

export const notifications = [
  {
    id: "accepted-answer",
    title: "Answer accepted",
    body: "Your explanation helped 24 learners in Calculus Circle.",
    time: "12m",
    tone: "teal" as YomeTone,
  },
  {
    id: "study-room",
    title: "Python Help Room is live",
    body: "Three people from your groups are working through recursion problems.",
    time: "34m",
    tone: "blue" as YomeTone,
  },
  {
    id: "project-invite",
    title: "New project invite",
    body: "Robotics Team invited you to review a greenhouse sensor build.",
    time: "2h",
    tone: "amber" as YomeTone,
  },
];

export const onboardingInterests = [
  { name: "Science", detail: "Physics, biology, chemistry", symbol: "SCI", tone: "teal" as YomeTone },
  { name: "Technology", detail: "Programming, AI, cybersecurity", symbol: "</>", tone: "blue" as YomeTone },
  { name: "Engineering", detail: "Robotics, electronics, design", symbol: "ENG", tone: "amber" as YomeTone },
  { name: "Mathematics", detail: "Calculus, statistics, algebra", symbol: "SIG", tone: "violet" as YomeTone },
];

export const onboardingGoals = [
  "Learn new skills",
  "Find a study group",
  "Ask academic questions",
  "Share projects",
  "Meet collaborators",
  "Teach or mentor others",
];
