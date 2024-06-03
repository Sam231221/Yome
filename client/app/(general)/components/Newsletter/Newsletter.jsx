import Link from "next/link";

// Newsletter.jsx
const Newsletter = () => {
  return (
    <section className=" bg-indigo-800 h-screen flex items-center justify-center">
      <div className="flex flex-col text-white items-center justify-center">
        <h2 className="text-center text-4xl md:text-5xl lg:text-6xl ">
          Get the
          <span className="text-yellow-400 font-bold">right</span> Product you{" "}
          <br /> need
        </h2>
        <Link href="/pricing">
          <button className="subscribe-btn mt-8 bg-blue-500 text-black   rounded px-6 py-3 font-bold transition duration-300 hover:bg-blue-700 hover:text-black focus:outline-none focus:shadow-outline active:bg-blue-800">
            Get started
          </button>
        </Link>
      </div>
    </section>
  );
};

export default Newsletter;
