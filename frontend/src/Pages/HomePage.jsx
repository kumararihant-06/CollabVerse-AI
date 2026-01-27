import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white">

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <h1 className="text-2xl font-bold tracking-wide">
          CollabVerse<span className="text-purple-400">-AI</span>
        </h1>

        <div className="flex items-center gap-6">
          <Link to="/login" className="text-gray-300 hover:text-white">
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl md:text-6xl font-bold leading-tight">
          Real-Time Collaborative Texting <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Built for Coders
          </span>
        </h2>

        <p className="text-gray-400 max-w-2xl mx-auto mt-6 text-lg">
          CollabVerse-AI lets developers collaborate, code, brainstorm, and chat
          together in real-time with AI-powered productivity.
        </p>

        <div className="flex justify-center gap-4 mt-10">
          <Link
            to="/register"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:opacity-90 transition"
          >
            Start Collaborating
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          ["Real-time Sync", "Collaborate instantly with teammates without delays."],
          ["AI Assisted Chat", "Smart suggestions, summaries and code assistance."],
          ["Secure Workspaces", "End-to-end encrypted team collaboration spaces."],
        ].map(([title, desc]) => (
          <div
            key={title}
            className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl hover:border-purple-500/40 transition"
          >
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{desc}</p>
          </div>
        ))}
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-12">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            ["Create Workspace", "Create or join collaborative coding rooms."],
            ["Invite Team", "Invite teammates & start messaging instantly."],
            ["Collaborate with AI", "Use AI tools to code, debug & brainstorm."],
          ].map(([title, desc], i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-purple-400 text-3xl font-bold mb-3">
                0{i + 1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 backdrop-blur-xl rounded-3xl p-16">
          <h2 className="text-4xl font-bold">
            Start Building Together with CollabVerse-AI
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            Experience next-generation collaboration for developers.
          </p>

          <Link
            to="/register"
            className="inline-block mt-8 px-10 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:opacity-90 transition"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CollabVerse-AI · Built for Developers
      </footer>

    </div>
  );
}
