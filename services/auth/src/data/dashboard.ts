export const dashboardTopicsData = [
  { slug: "artificial-intelligence", title: "Artificial Intelligence", postCount: 2800, discussionLabel: "posts", tone: "blue", trendScore: 100 },
  { slug: "calculus", title: "Calculus", postCount: 1700, discussionLabel: "posts", tone: "violet", trendScore: 92 },
  { slug: "robotics", title: "Robotics", postCount: 1200, discussionLabel: "posts", tone: "amber", trendScore: 84 },
  { slug: "quantum-physics", title: "Quantum Physics", postCount: 940, discussionLabel: "posts", tone: "teal", trendScore: 76 },
] as const;

export const dashboardPostsData = [
  {
    slug: "integration-by-parts",
    kind: "Question",
    authorUsername: "sarahchen",
    groupSlug: "calculus-circle",
    title: "Can someone explain integration by parts intuitively?",
    description:
      "I understand the formula, but I am struggling to see why it works geometrically. Is there a visual way to think about it?",
    tone: "teal",
    tags: ["Mathematics", "Calculus"],
    helpfulCount: 12,
    answerCount: 8,
    shareCount: 3,
    topAnswerAuthor: "Dr. James Liu",
    topAnswerBody:
      "Think of it as reversing the product rule: you're redistributing which function gets differentiated...",
    hoursAgo: 2,
  },
  {
    slug: "smart-greenhouse",
    kind: "Project",
    authorUsername: "alexnguyen",
    groupSlug: "robotics-team",
    title: "We built an Arduino smart greenhouse 🌱",
    description:
      "Our four-person team finished the first working prototype. It monitors soil moisture, temperature, and light, then waters plants automatically.",
    tone: "amber",
    tags: ["Engineering", "Programming"],
    inspiredCount: 48,
    commentCount: 12,
    shareCount: 6,
    projectTeam: "4 students",
    projectProgress: "Prototype complete",
    projectStack: "Arduino · C++",
    hoursAgo: 5,
  },
] as const;

export const dashboardStudyRoomsData = [
  {
    slug: "python-help",
    title: "Python Help Room",
    meta: "14 studying now",
    groupSlug: "python-learners",
    symbol: "</>",
    tone: "blue",
    activeParticipantCount: 14,
    participantUsernames: ["alexnguyen", "sarahchen", "priyasharma"],
  },
  {
    slug: "physics-problem-solving",
    title: "Physics Problem Solving",
    meta: "7 studying now",
    groupSlug: "physics-club",
    symbol: "φ",
    tone: "teal",
    activeParticipantCount: 7,
    participantUsernames: ["alexnguyen", "sarahchen", "priyasharma"],
  },
] as const;

export const dashboardSessionsData = [
  {
    groupSlug: "calculus-circle",
    title: "Calculus Revision Session",
    type: "Study session",
    startsInDays: 0,
    startsAtHour: 16,
    startsAtMinute: 0,
    location: "Mathematics Study Group",
    tone: "violet",
  },
  {
    groupSlug: "python-learners",
    title: "Intro to Machine Learning",
    type: "Study session",
    startsInDays: 2,
    startsAtHour: 14,
    startsAtMinute: 30,
    location: "AI & ML Community",
    tone: "amber",
  },
] as const;
