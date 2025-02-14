"use client";

import { useEffect } from "react";
import { ArrowRight, MessageCircle, Video, Shield } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b bg-blue-50/40  to-white">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 ConnectNow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="container flex flex-col justify-center items-center h-screen mx-auto px-4 py-20 text-center">
      <motion.h1
        className="text-5xl md:text-6xl font-bold text-blue-900 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Connect Instantly with{" "}
        <span className="text-blue-600">Video & Chat</span>
      </motion.h1>
      <motion.p
        className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Experience seamless communication with our cutting-edge video calling
        and chat platform. Stay connected with friends, family, and colleagues
        like never before.
      </motion.p>
      <motion.div
        className="flex justify-center space-x-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Link
          href="/login"
          className="bg-blue-600 flex items-center text-md px-4 py-3 hover:bg-blue-700 text-white"
        >
          <span>Get Started</span>
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
        <button className="border-blue-600 text-md px-4 py-3 text-blue-600 hover:bg-blue-50">
          Learn More
        </button>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <section id="features" className="bg-white py-20" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl font-bold text-center text-blue-900 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 20 },
          }}
          transition={{ duration: 0.5 }}
        >
          Key Features
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Video className="h-12 w-12 text-blue-600" />}
            title="Crystal Clear Video Calls"
            description="Enjoy high-quality video calls with advanced compression technology for smooth communication."
            delay={0}
          />
          <FeatureCard
            icon={<MessageCircle className="h-12 w-12 text-blue-600" />}
            title="Instant Messaging"
            description="Send text, emojis, and files instantly with our real-time chat feature."
            delay={0.2}
          />
          <FeatureCard
            icon={<Shield className="h-12 w-12 text-blue-600" />}
            title="Secure & Private"
            description="Your conversations are protected with end-to-end encryption for maximum privacy."
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      className="bg-blue-50/40 p-6 rounded-lg text-center hover:shadow-lg transition-shadow"
      initial="hidden"
      animate={controls}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 50 },
      }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className="inline-block p-3 bg-blue-100 rounded-full mb-4"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold text-blue-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

function CTASection() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <section className="bg-blue-900 text-white py-20" ref={ref}>
      <motion.div
        className="container mx-auto px-4 text-center"
        initial="hidden"
        animate={controls}
        variants={{
          visible: { opacity: 1, y: 0 },
          hidden: { opacity: 0, y: 50 },
        }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of satisfied users and experience the future of
          communication today.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href={"/login"}
            className="bg-white inline-block text-center  items-center px-3 py-2 text-md text-blue-900 hover:bg-blue-50"
          >
            <span>Sign Up Now</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
