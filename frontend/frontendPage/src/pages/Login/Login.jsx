import React, { useState } from "react";
import api from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./Login.css";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const params = new URLSearchParams(location.search);
  const selectedRole = params.get("role");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");

    setLoading(true);
    try {
      const body = { email, password };
      if (selectedRole) body.role = selectedRole;
      const res = await api.post("/auth/login", body);

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      
      // Redirect based on role
      const role = res.data.user.role;
      console.log("Login successful - User role:", role);
      toast.success(`Welcome back as ${role} 🎉`);
      
      // Use replace to prevent back navigation to login
      if (role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (role === "teacher") {
        navigate("/teacher-dashboard", { replace: true });
      } else {
        navigate("/student-dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card app-card">
        <h2 className="login-title">
          Sign in{" "}
          {selectedRole && (
            <span className="login-role">
              ({selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)})
            </span>
          )}
        </h2>

        <p className="login-subtext">
          Access your personalized learning dashboard 🚀
        </p>

        <form onSubmit={submit} className="login-form">
          <label>Email</label>
          <input
            className="form-control"
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-box">
            <input
              className="form-control"
              placeholder="Enter password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="toggle-pass"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "👁️" : "👁️‍🗨️"}
            </span>
          </div>

          <button className="btn btn-primary login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-bottom">
            New here? <a href="/register">Create an account</a>
          </p>
        </form>
      </div>

      <div className="login-side-art">
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/digital-student-learning-4894158-4091433.png"
          alt="Learning"
        />
      </div>
    </div>
  );
}
