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

export function SettingsContent() {
  return (
    <div className="yome-page min-w-0 text-yome-text">
      <div className="yome-page-heading flex items-end justify-between gap-5">
        <div>
          <p>Settings</p>
          <h1>Shape your Yome experience</h1>
          <span>Profile controls, privacy preferences, notifications, and safety.</span>
        </div>
      </div>
      <div className="yome-card yome-section rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <p className="yome-card-copy rounded-yome border border-yome-border bg-yome-surface shadow-yome">Settings content remains available and can be brought over to the exact reference layout next.</p>
      </div>
    </div>
  );
}
