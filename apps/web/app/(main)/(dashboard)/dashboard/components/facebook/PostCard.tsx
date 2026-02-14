import React from "react";
import { AiOutlineLike } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { Post } from "./types";

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${post.avatarGradient}`}
          />
          <div>
            <p className="text-sm font-semibold text-[var(--fb-text)]">
              {post.author}
            </p>
            <p className="text-xs text-[var(--fb-muted)]">{post.time} · Public</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[var(--fb-muted)]">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsThreeDots />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <IoClose />
          </button>
        </div>
      </header>

      <p className="mt-3 text-sm text-[var(--fb-text)]">{post.content}</p>

      <div
        className={`mt-3 h-64 w-full rounded-2xl bg-gradient-to-br ${post.mediaGradient}`}
      />

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--fb-muted)]">
        <span>{post.likes} likes</span>
        <span>
          {post.comments} comments · {post.shares} shares
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--fb-divider)] pt-3 text-xs text-[var(--fb-muted)]">
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 transition hover:bg-[var(--fb-bg)]">
          <AiOutlineLike className="text-base" /> Like
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 transition hover:bg-[var(--fb-bg)]">
          <FaRegComment className="text-base" /> Comment
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 transition hover:bg-[var(--fb-bg)]">
          <FiShare2 className="text-base" /> Share
        </button>
      </div>
    </article>
  );
}
