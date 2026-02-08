import {useContext} from "react";
import { UserContext } from "../context/User.context";
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import { disconnectSocket } from "../config/socket.js";

const ProfilePage = () => {

    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.post("/user/logout",{}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            disconnectSocket();
            navigate("/login");
            setUser(null);
            localStorage.removeItem("token");
        } catch (error) {
            console.log("Error during logout: ", error.response?.data || error.message);
            alert("Failed to logout. Please try again.")
        }
    
    }

  return (
     <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white flex justify-center items-center">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-semibold mb-6">Profile</h2>

        <div className="space-y-4 text-gray-300">
          <p>
            <span className="text-gray-400">Username:</span> {user?.username}
          </p>

          <p>
            <span className="text-gray-400">Email:</span> {user?.email}
          </p>

        </div>

        <button
          onClick={handleLogout}
          className="mt-8 w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 transition font-semibold"
        >
          Logout
        </button>

      </div>
    </div>
  )
}

export default ProfilePage