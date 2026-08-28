"use client";

import Link from "next/link";
import { useState } from "react";

const iconPaths = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  help:
    '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.3 2.2c-1 .7-1.8 1.2-1.8 2.8M12 18h.01"/>',
  flask:
    '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  profile:
    '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  message:
    '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>',
} as const;

function Icon({ name, size = 20 }: { name: keyof typeof iconPaths; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  );
}

function Avatar({
  initials,
  tone = "blue",
  size = "md",
}: {
  initials: string;
  tone?: "blue" | "teal" | "amber" | "violet";
  size?: "xs" | "sm" | "md";
}) {
  return <span className={`avatar avatar-${tone} avatar-${size}`}>{initials}</span>;
}

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "teal" | "amber" | "violet" | "neutral";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Link className="auth-brand landing-brand" href="/">
          <span className="brand-mark">Y</span>
          <span>yome</span>
        </Link>
        <div className={menuOpen ? "landing-links open" : "landing-links"}>
          <a href="#communities">Communities</a>
          <a href="#learn">How it works</a>
          <a href="#safety">Safety</a>
        </div>
        <div className="landing-actions">
          <Link className="landing-login" href="/login">
            Sign in
          </Link>
          <Link className="primary-button" href="/login?tab=register">
            Join Yome
          </Link>
          <button
            className="landing-menu"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "x" : "\u2630"}
          </button>
        </div>
      </nav>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="landing-pill">
              <span>&#10022;</span> The social network built for learning
            </div>
            <h1>
              Your next breakthrough starts with <em>the right people.</em>
            </h1>
            <p>
              Join students, educators, and STEM communities sharing questions,
              building projects, and learning together.
            </p>
            <div className="hero-actions">
              <Link className="primary-button hero-primary" href="/login?tab=register">
                Start learning together <Icon name="arrow" size={18} />
              </Link>
              <Link className="hero-secondary" href="/dashboard">
                <span className="play-button">&#9654;</span> Explore the demo
              </Link>
            </div>
            <div className="landing-proof">
              <div className="proof-avatars">
                <Avatar initials="SC" tone="teal" />
                <Avatar initials="AN" tone="amber" />
                <Avatar initials="PS" tone="violet" />
                <Avatar initials="JL" tone="blue" />
              </div>
              <div>
                <strong>12,000+ curious minds</strong>
                <span>Learning across 80+ STEM communities</span>
              </div>
            </div>
          </div>
          <div className="hero-product" aria-label="Preview of the Yome learning feed">
            <div className="hero-glow" />
            <div className="product-window">
              <header>
                <div className="mini-brand">
                  <span>Y</span> yome
                </div>
                <div className="mini-search">⌕ Search people, groups, topics...</div>
                <Avatar initials="MP" tone="violet" size="xs" />
              </header>
              <div className="product-body">
                <aside>
                  <i className="active">&#8962;</i>
                  <i>&#9673;</i>
                  <i>&#9671;</i>
                  <i>&#9678;</i>
                  <i>&#9649;</i>
                </aside>
                <section>
                  <div className="mini-welcome">
                    <span>Good afternoon, Maya</span>
                    <b>12 day streak</b>
                  </div>
                  <div className="mini-composer">
                    <Avatar initials="MP" tone="violet" size="xs" />
                    <span>Share what you&apos;re learning...</span>
                  </div>
                  <article className="mini-post">
                    <div className="mini-author">
                      <Avatar initials="SC" tone="teal" size="xs" />
                      <span>
                        <strong>Sarah Chen</strong>
                        <small>Mathematics · 2h</small>
                      </span>
                      <b>Question</b>
                    </div>
                    <h3>Can someone explain integration by parts intuitively?</h3>
                    <p>
                      I understand the formula, but I&apos;m struggling to see why it
                      works geometrically.
                    </p>
                    <div className="mini-answer">
                      <span>&#10003;</span>
                      <small>
                        <strong>Top answer</strong>
                        <br />
                        Think of it as reversing the product rule...
                      </small>
                    </div>
                    <footer>
                      <span>&#9825; Helpful</span>
                      <span>&#9649; Answer</span>
                      <span>&#9671; Save</span>
                    </footer>
                  </article>
                </section>
                <aside className="mini-rail">
                  <strong>Live study rooms</strong>
                  <div>
                    <b>&lt;/&gt;</b>
                    <span>
                      Python Help
                      <small>14 studying</small>
                    </span>
                  </div>
                  <div>
                    <b>&#966;</b>
                    <span>
                      Physics Lab
                      <small>7 studying</small>
                    </span>
                  </div>
                  <strong>Trending</strong>
                  <small># Artificial Intelligence</small>
                  <small># Robotics</small>
                </aside>
              </div>
            </div>
            <div className="floating-card floating-room">
              <span className="live-dot" />
              <div>
                <strong>Python Help Room</strong>
                <small>14 studying now</small>
              </div>
              <button>Join</button>
            </div>
            <div className="floating-card floating-answer">
              <span>&#10003;</span>
              <div>
                <strong>Answer accepted</strong>
                <small>Your explanation helped 24 learners</small>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-marquee" aria-label="STEM subjects">
          <span>SCIENCE</span>
          <i>&#9883;</i>
          <span>TECHNOLOGY</span>
          <i>&lt;/&gt;</i>
          <span>ENGINEERING</span>
          <i>&#9881;</i>
          <span>MATHEMATICS</span>
          <i>&#931;</i>
        </section>

        <section className="landing-section" id="communities">
          <div className="landing-heading">
            <p className="eyebrow">Built around curiosity</p>
            <h2>Everything you need to learn socially&#8212;without the noise.</h2>
            <span>
              Yome turns questions, shared work, and focused communities into an
              educational network.
            </span>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-large blue">
              <div className="feature-icon">
                <Icon name="users" />
              </div>
              <Badge tone="blue">Focused communities</Badge>
              <h3>Find your learning people</h3>
              <p>
                Join groups built around real subjects, shared goals, study
                levels, and collaborative projects.
              </p>
              <div className="community-stack">
                <div>
                  <span>AI</span>
                  <b>
                    AI &amp; Machine Learning
                    <small>18.4k learners</small>
                  </b>
                  <i>Join</i>
                </div>
                <div>
                  <span>&#966;</span>
                  <b>
                    Physics Problem Solvers
                    <small>9.2k learners</small>
                  </b>
                  <i>Join</i>
                </div>
                <div>
                  <span>&#9881;</span>
                  <b>
                    Robotics Club
                    <small>7.8k learners</small>
                  </b>
                  <i>Join</i>
                </div>
              </div>
            </article>
            <article className="feature-card violet">
              <div className="feature-icon">
                <Icon name="help" />
              </div>
              <Badge tone="violet">Questions that matter</Badge>
              <h3>Turn confusion into understanding</h3>
              <p>
                Ask academic questions, find useful explanations, and recognize
                accepted answers.
              </p>
              <div className="answer-metric">
                <strong>24</strong>
                <span>learners found this helpful</span>
              </div>
            </article>
            <article className="feature-card amber">
              <div className="feature-icon">
                <Icon name="flask" />
              </div>
              <Badge tone="amber">Projects over popularity</Badge>
              <h3>Show what you&apos;re building</h3>
              <p>
                Share progress, find collaborators, and collect thoughtful
                feedback.
              </p>
              <div className="project-metric">
                <span>ARDUINO / SMART GREENHOUSE</span>
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="learning-together" id="learn">
          <div className="learning-copy">
            <p className="eyebrow">Learning, redesigned</p>
            <h2>From &#8220;I don&apos;t get it&#8221; to &#8220;we built it.&#8221;</h2>
            <p>
              Yome connects every stage of learning: discover a topic, ask for
              help, study live, and turn knowledge into projects.
            </p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Choose what drives you</strong>
                  <small>
                    Build an academic identity around interests, skills, and
                    goals.
                  </small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Meet your community</strong>
                  <small>
                    Find people and groups through meaningful shared interests.
                  </small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Learn by doing</strong>
                  <small>
                    Join study rooms, exchange resources, and collaborate on
                    projects.
                  </small>
                </div>
              </li>
            </ol>
          </div>
          <div className="learning-visual">
            <div className="path-orbit">
              <span className="path-center">Y</span>
              <span className="path-node n1">?</span>
              <span className="path-node n2">&#9678;</span>
              <span className="path-node n3">&#9881;</span>
              <span className="path-node n4">&#10022;</span>
            </div>
            <div className="path-label label-one">Ask a question</div>
            <div className="path-label label-two">Join a study room</div>
            <div className="path-label label-three">Build together</div>
          </div>
        </section>

        <section className="safety-section" id="safety">
          <div>
            <div className="safety-mark">
              <Icon name="check" size={25} />
            </div>
            <p className="eyebrow">Designed for trust</p>
            <h2>A safer space to grow your academic network.</h2>
            <p>
              Thoughtful privacy controls, clear reporting, group moderation,
              and learning-first recommendations are part of the foundation&#8212;not
              an afterthought.
            </p>
          </div>
          <div className="safety-grid">
            <span>
              <Icon name="profile" />
              <strong>Profile control</strong>
              <small>Choose who sees and contacts you.</small>
            </span>
            <span>
              <Icon name="users" />
              <strong>Community moderation</strong>
              <small>Roles, rules, and reporting tools.</small>
            </span>
            <span>
              <Icon name="message" />
              <strong>Message safety</strong>
              <small>Control requests, calls, and blocking.</small>
            </span>
            <span>
              <Icon name="check" />
              <strong>Learning-first ranking</strong>
              <small>Helpful contributions over popularity.</small>
            </span>
          </div>
        </section>

        <section className="landing-cta">
          <div className="cta-grid" />
          <span className="cta-symbol s1">&#931;</span>
          <span className="cta-symbol s2">&#9883;</span>
          <span className="cta-symbol s3">&lt;/&gt;</span>
          <p className="eyebrow">Your community is waiting</p>
          <h2>
            Learn something remarkable.
            <br />
            Build it together.
          </h2>
          <p>
            Create your academic profile and find the people who make curiosity
            contagious.
          </p>
          <Link className="primary-button" href="/login?tab=register">
            Join Yome for free <Icon name="arrow" size={17} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Link className="auth-brand landing-brand" href="/">
          <span className="brand-mark">Y</span>
          <span>yome</span>
        </Link>
        <p>The social network built for learning.</p>
        <div>
          <a href="#communities">Communities</a>
          <a href="#safety">Safety</a>
          <Link href="/login">Sign in</Link>
        </div>
        <small>&copy; 2026 Yome. Learn together.</small>
      </footer>
    </div>
  );
}
