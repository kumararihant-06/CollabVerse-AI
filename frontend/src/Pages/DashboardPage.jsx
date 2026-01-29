import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("");
  const [username, setUsername] = useState("Arihant");

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Realtime Code Collab",
      description: "Live collaborative coding workspace",
      updatedAt: "2 hours ago",
    },
    {
      id: 2,
      name: "AI Debug Assistant",
      description: "Smart bug detection and fix suggestions",
      updatedAt: "Yesterday",
    },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white px-6 py-10">

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold">
          {greeting}, <span className="text-purple-400">{username}</span> 👋
        </h1>
        <p className="text-gray-400 mt-1">
          Let’s build something amazing today.
        </p>
      </div>

      {/* Projects Section */}
      <div className="max-w-7xl mx-auto mt-12">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Projects</h2>

          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-medium hover:opacity-90 transition">
            <Plus size={18} />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">
              No projects yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first collaborative project.
            </p>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-purple-500/40 transition cursor-pointer"
              >
                <h3 className="text-lg font-semibold mb-1">
                  {project.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {project.description}
                </p>
                <p className="text-xs text-gray-500">
                  Updated {project.updatedAt}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
