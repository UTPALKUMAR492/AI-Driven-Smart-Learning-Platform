import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import CourseCard from "../../components/CourseCard/CourseCard";
import Loader from "../../components/Loader/Loader";
import { toast } from "react-toastify";
import "./Home.css";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data))
      .catch(() => toast.error("Unable to load courses 😢"))
      .finally(() => setLoading(false));
  }, []);

  const goToRoleLogin = (role) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <>
      {/* ---------- HERO SECTION ---------- */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-left">
            <h1 className="hero-title">
              Empower Your Learning Journey with <span>SmartEdu</span>
            </h1>
            <p className="hero-subtext">
              Learn at your own pace with structured courses, personalized
              recommendations, and practice quizzes.
            </p>

            <div className="hero-buttons">
              <a href="/courses" className="btn btn-primary hero-btn">
                Explore Courses
              </a>
              <a href="/register" className="btn btn-outline-secondary hero-btn2">
                Get Started
              </a>
            </div>
          </div>

          <div className="hero-right">
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/online-learning-illustration-download-in-svg-png-gif-file-formats--digital-education-teaching-web-hosting-pack-education-illustrations-5825441.png"
              alt="Learning Illustration"
              className="hero-illustration"
            />
          </div>
        </div>
      </section>

      {/* ---------- ROLE-BASED PORTALS ---------- */}
      <section className="role-section">
        <div className="container">
          <h2 className="section-title center">Choose your portal</h2>
          <p className="role-subtitle">
            Log in as a <strong>Student</strong>, <strong>Teacher</strong>, or{" "}
            <strong>Admin</strong> to access your personalized dashboard.
          </p>

          <div className="role-grid">
            {/* Student */}
            <div className="role-card role-student">
              <div className="role-icon">🎓</div>
              <h3>Student</h3>
              <p className="text-muted small">
                Access courses, attempt quizzes, and track your learning progress.
              </p>
              <button
                className="btn btn-primary w-100 mt-2"
                type="button"
                onClick={() => goToRoleLogin("student")}
              >
                Login as Student
              </button>
            </div>

            {/* Teacher */}
            <div className="role-card role-teacher">
              <div className="role-icon">👩‍🏫</div>
              <h3>Teacher</h3>
              <p className="text-muted small">
                Manage course content, create quizzes, and view student analytics.
              </p>
              <button
                className="btn btn-outline-secondary w-100 mt-2"
                type="button"
                onClick={() => goToRoleLogin("teacher")}
              >
                Login as Teacher
              </button>
            </div>

            {/* Admin */}
            <div className="role-card role-admin">
              <div className="role-icon">🛡️</div>
              <h3>Admin</h3>
              <p className="text-muted small">
                Control users, courses, and overall platform configuration.
              </p>
              <button
                className="btn btn-outline-secondary w-100 mt-2"
                type="button"
                onClick={() => goToRoleLogin("admin")}
              >
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRENDING COURSES SLIDER ---------- */}
      <section className="container trending-section mt-5">
        <h2 className="section-title">🔥 Trending Courses</h2>

        {loading ? (
          <Loader />
        ) : (
          <div className="trending-slider">
            <div className="trending-track">
              {courses.slice(0, 6).map((c) => (
                <div className="trending-item app-card" key={c._id}>
                  <h5>{c.title}</h5>
                  <p className="text-muted small">
                    {c.description?.substring(0, 90)}...
                  </p>
                  <a
                    href={`/courses/${c._id}`}
                    className="btn btn-primary btn-sm mt-2"
                  >
                    View Course
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="feature-section container">
        <h2 className="section-title">Why SmartEdu?</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h4>AI-Based Recommendations</h4>
            <p>Get smart personalized suggestions based on your performance.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h4>Structured Courses</h4>
            <p>Learn cleanly with organized lessons and practice problems.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h4>Interactive Quizzes</h4>
            <p>Test your knowledge instantly with powerful scoring logic.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h4>Track Progress</h4>
            <p>Monitor improvement clearly using dashboard insights.</p>
          </div>
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="category-section container">
        <h2 className="section-title">Popular Categories</h2>

        <div className="category-grid">
          {[
            "Web Development",
            "AI / Machine Learning",
            "Data Structures",
            "Python Programming",
            "Cyber Security",
            "Cloud Computing",
          ].map((cat, idx) => (
            <div className="category-card" key={idx}>
              <span>📌</span> {cat}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- RECOMMENDED COURSES ---------- */}
      <div className="container mt-4">
        <h2 className="section-title">Recommended Courses</h2>

        {loading ? (
          <Loader />
        ) : (
          <div className="card-list">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
