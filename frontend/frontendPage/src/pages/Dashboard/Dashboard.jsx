
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosConfig";
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import DashboardIcon from '@mui/icons-material/Dashboard';
import { ChatClient } from '../../components/Chat';

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
    <Box className="dashboard-wrapper container" sx={{ mt: 4 }}>
      <Card className="dashboard-header app-card" elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Here's your learning summary.
          </Typography>
          {stats && (
            <Grid container spacing={2} className="stats-grid">
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card app-card" elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Total Quizzes</Typography>
      {/* --- Minimal Chat Client Demo --- */}
      <Box sx={{ mt: 4 }}>
        <ChatClient room="global" user={user} />
      </Box>
                    <Typography variant="h5">{stats.totalQuizzes}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card app-card" elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Average Score</Typography>
                    <Typography variant="h5">{stats.avgScore}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card app-card" elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Hours Studied</Typography>
                    <Typography variant="h5">{stats.hoursSpent}h</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card app-card" elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Rank</Typography>
                    <Typography variant="h5">#{stats.rank}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
      <Grid container spacing={2} className="chart-activity-grid">
        <Grid item xs={12} md={6}>
          <Card className="app-card chart-card" elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Score Distribution</Typography>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="app-card recent-card" elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
              <ul className="recent-list">
                {recent.map(r => (
                  <li key={r._id}>
                    <span>{r.title}</span>
                    <strong>{r.score}%</strong>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
    </Box>
  );
}
