import React from "react";
import { posts } from "./data";
import PostCard from "./PostCard";

export default function Feed() {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
