import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios.js";
import { useState, useContext } from "react";
import { UserContext } from "../context/User.context.jsx"; 
export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {setUser} = useContext(UserContext);

  const submitHandler = async (e) =>{
    e.preventDefault();
    try {
      const response = await axios.post("/user/register",({
        username,
        email,
        password
      }));
        console.log("Registration successful", response.data);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user)
        navigate("/dashboard");
    } catch (error) {
      console.log("Error during registration.", error)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-white">
        
        <h2 className="text-3xl font-semibold text-center">Create Account</h2>
        <p className="text-center text-gray-400 mt-2 mb-8">
          Sign up to get started
        </p>

        <form onSubmit={submitHandler} className="space-y-5">
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Full Name</label>
            <input
              onChange={e => {setUsername(e.target.value)}}
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              onChange={e => {setEmail(e.target.value)}}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              onChange={e => {setPassword(e.target.value)}}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:opacity-90 transition"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}
