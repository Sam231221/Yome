export type SubscriptionPlan = {
  id: number;
  plan: string;
  description: string;
  features: string[];
  priceId: string;
  price: number;
};

export const SubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 1,
    plan: "Standard",
    description:
      "Ideal for schools needing essential tools like student management, attendance tracking, basic gradebook, limited communication features, and standard reporting.",
    features: [
      "Student Management",
      "Attendance Tracking",
      "Basic Gradebook",
      "Limited Communication",
      "Standard Reporting",
    ],
    priceId: "standard",
    price: 50,
  },
  {
    id: 23,
    plan: "Pro",
    description:
      "Tailored for schools requiring more advanced features such as enhanced student management, automated attendance, comprehensive gradebook, improved communication tools, priority support, and detailed reporting.",
    features: [
      "Enhanced Student Management",
      "Automated Attendance",
      "Comprehensive Gradebook",
      "Improved Communication Tools",
      "Priority Support",
      "Detailed Reporting",
    ],
    priceId: "pro",
    price: 499,
  },
  {
    id: 45,
    plan: "Enterprise",
    description:
      "Designed for institutions seeking top-tier functionalities including unlimited student management, customizable modules, AI-driven insights, integrated Learning Management System (LMS), dedicated parent portal, 24/7 support, and robust data security.",
    features: [
      "Unlimited Student Management",
      "Customizable Modules",
      "AI-Driven Insights",
      "Integrated Learning Management System (LMS)",
      "Dedicated Parent Portal",
      "24/7 Support",
      "Robust Data Security",
    ],
    priceId: "enterprise",
    price: 499,
  },
];
