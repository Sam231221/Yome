"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  FileText,
  Headphones,
  HelpCircle,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Avatar, Badge } from "@/components/ui";
import { groups, onboardingGoals, onboardingInterests, type YomeTone } from "@/features/learning/data";
import { discoveryGroups, GroupCard, MembersGrid, QuestionCard } from "./shared";

export function NotificationsContent() {
  return (
    <div className="yome-page yome-page-narrow min-w-0 text-yome-text">
      <div className="yome-page-heading flex items-end justify-between gap-5">
        <div>
          <p>Notifications</p>
          <h1>What needs your attention</h1>
          <span>Learning updates, invitations, and accepted answers.</span>
        </div>
      </div>
      <div className="yome-list">
        {["Answer accepted", "Python Help Room is live", "New project invite"].map((title) => (
          <article key={title} className="yome-card yome-section rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h2 className="yome-card-title rounded-yome border border-yome-border bg-yome-surface shadow-yome">{title}</h2>
          </article>
        ))}
      </div>
    </div>
  );
}
