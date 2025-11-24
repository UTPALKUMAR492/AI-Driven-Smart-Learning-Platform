import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosConfig";
import "./Dashboard.css";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    api.get("/student/stats").then(res => setStats(res.data));
    api.get("/student/recent").then(res => setRecent(res.data));
    api.get("/student/recommendations").then(res => setRecommended(res.data));
  }, []);

  const COLORS = ["#4A6CF7", "#6C63FF", "#FFB200", "#5CC96B"];

  return (
    <div className="dashboard-wrapper container mt-4">
      <div className="dashboard-header app-card">
        <h2>Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
        <p className="text-muted">Here's your learning summary.</p>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card app-card">
              <h6>Total Quizzes</h6>
              <h3>{stats.totalQuizzes}</h3>
            </div>

            <div className="stat-card app-card">
              <h6>Average Score</h6>
              <h3>{stats.avgScore}%</h3>
            </div>

            <div className="stat-card app-card">
              <h6>Hours Studied</h6>
              <h3>{stats.hoursSpent}h</h3>
            </div>

            <div className="stat-card app-card">
              <h6>Rank</h6>
              <h3>#{stats.rank}</h3>
            </div>
          </div>
        )}
      </div>

      <div className="chart-activity-grid">
        <div className="app-card chart-card">
          <h5>Score Distribution</h5>
          {stats?.scoreDistribution && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.scoreDistribution} dataKey="value" outerRadius={80}>
                  {stats.scoreDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="app-card recent-card">
          <h5>Recent Activity</h5>
          <ul className="recent-list">
            {recent.map(r => (
              <li key={r._id}>
                <span>{r.title}</span>
                <strong>{r.score}%</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="app-card recommended-card mt-4">
        <h5>Continue Learning</h5>
        <div className="recommended-grid">
          {recommended.map(course => (
            <div className="rec-card" key={course._id}>
              <h6>{course.title}</h6>
              <p>{course.description?.slice(0, 50)}...</p>
              <a href={`/courses/${course._id}`} className="rec-btn">Continue →</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
