import test from "node:test";
import assert from "node:assert/strict";
import {
  getSuggestedUserName,
  normalizeDashboardHome,
  normalizeSuggestedGroup,
  normalizeSuggestedUser,
} from "./dashboardApi";

test("getSuggestedUserName prefers full name, then name, then username", () => {
  assert.equal(
    getSuggestedUserName({
      id: 1,
      firstname: "Sameer",
      lastname: "Shah",
    }),
    "Sameer Shah"
  );

  assert.equal(
    getSuggestedUserName({
      id: 2,
      name: "Fallback Name",
    }),
    "Fallback Name"
  );

  assert.equal(
    getSuggestedUserName({
      id: 3,
      username: "mrsam",
    }),
    "mrsam"
  );
});

test("normalizeSuggestedUser returns stable dashboard suggestion data", () => {
  assert.deepEqual(
    normalizeSuggestedUser({
      id: 7,
      firstname: "Ava",
      lastname: "Stone",
      role: "MENTOR",
      profilePicture: "",
    }),
    {
      id: 7,
      name: "Ava Stone",
      subtitle: "mentor on Yome",
      profilePicture: "/avatars/userprofile.png",
    }
  );
});

test("normalizeSuggestedGroup supplies safe display fallbacks", () => {
  assert.deepEqual(
    normalizeSuggestedGroup({
      id: "group-123",
      name: "",
      about: "",
      thumbnail: "",
    }),
    {
      id: "group-123",
      name: "Untitled group",
      about: "Community group on Yome",
      thumbnail: "/avatars/groupprofile.png",
    }
  );
});

test("normalizeDashboardHome returns stable section defaults", () => {
  const dashboard = normalizeDashboardHome({
    profile: {
      id: 1,
      name: "Sameer Shahi",
      firstName: "Sameer",
      username: "sameer",
      role: "Student",
      initials: "SS",
      profilePicture: "",
      learningStreakDays: 12,
      notificationCount: 3,
    },
    feedPosts: [
      {
        id: "post-1",
        type: "Question",
        author: "Sarah Chen",
        initials: "SC",
        tone: "teal",
        time: "2h",
        title: "Question title",
        body: "Question body",
        tags: ["Calculus"],
        stat: "12 helpful",
        detail: "8 answers",
        topAnswer: { author: "Dr. James Liu", body: "Helpful answer" },
        project: null,
        shareCount: 3,
      },
    ],
  });

  assert.equal(dashboard.profile.name, "Sameer Shahi");
  assert.equal(dashboard.feedPosts[0]?.tone, "teal");
  assert.deepEqual(dashboard.liveStudyRooms, []);
  assert.deepEqual(dashboard.upcomingSessions, []);
  assert.deepEqual(dashboard.suggestedPeople, []);
  assert.deepEqual(dashboard.trendingTopics, []);
  assert.deepEqual(dashboard.sidebarGroups, []);
});
