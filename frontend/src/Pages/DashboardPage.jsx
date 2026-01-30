import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { Plus } from "lucide-react";
import {UserContext} from "../context/User.context.jsx";
import CreateProjectModal from "../components/CreateProjectModal.jsx";
import axios from '../config/axios.js';

export default function DashboardPage() {
    const {user,loading} = useContext(UserContext);
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState("");
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateProject = async (projectName) => {
        try {
            const token = localStorage.getItem("token");
        const newProject = await axios.post("/project/create", 
            {projectName: projectName},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
        setProjects((prev) => [newProject.data.project, ...prev]);
        } catch (error) {
            console.log("Error creating project: ", error.response?.data || error.message )
            alert("Failed to create project. Please try again.")
        }
    };

    useEffect(() => {
    if(!user && !loading){
        navigate("/login");
    }
    },[user,loading, navigate]);

    useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);
  if(loading){
        return <div className="bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white flex justify-center items-center h-screen text-5xl">Loading....</div>
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white px-6 py-10">

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold">
          {greeting}, <span className="text-purple-400">{user?.username}</span> 👋
        </h1>
        <p className="text-gray-400 mt-1">
          Let’s build something amazing today.
        </p>
      </div>

      {/* Projects Section */}
      <div className="max-w-7xl mx-auto mt-12">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Projects</h2>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-medium hover:opacity-90 transition">
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
            <button onClick={() =>setIsModalOpen(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
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
                
              </div>
            ))}
          </div>
        )}

      </div>
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
