import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const auth = useAuth()
  const user = auth?.user
  const logout = auth?.logout || (()=>{})
  const getRoleIcon = (role) => {
    if (role === 'admin') return <AdminPanelSettingsIcon fontSize="small" />;
    if (role === 'teacher') return <PersonIcon fontSize="small" />;
    return <SchoolIcon fontSize="small" />;
  };
  return (
    <AppBar position="static" color="default" elevation={2} sx={{ mb: 2 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SchoolIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" fontWeight={700} color="primary">SmartEdu</Typography>
          </Link>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, ml: 4 }}>
            <Button component={Link} to="/" color="inherit">Home</Button>
            <Button component={Link} to="/courses" color="inherit">Courses</Button>
            <Button component={Link} to="/quizzes" color="inherit">Quizzes</Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user ? (
            <>
              <Tooltip title={user.role} arrow>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  {getRoleIcon(user.role)}
                </Avatar>
              </Tooltip>
              <Typography variant="body1" fontWeight={500} sx={{ mx: 1 }}>{user.name?.split(' ')[0]}</Typography>
              {user.role === 'admin' && (
                <Button component={Link} to="/admin-dashboard" variant="outlined" color="secondary">Admin</Button>
              )}
              {user.role === 'teacher' && (
                <Button component={Link} to="/teacher-dashboard" variant="outlined" color="secondary">Teacher Dashboard</Button>
              )}
              {user.role === 'student' && (
                <Button component={Link} to="/student-dashboard" variant="outlined" color="secondary">My Learning</Button>
              )}
              <Button variant="outlined" color="error" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" variant="outlined" color="primary">Login</Button>
              <Button component={Link} to="/register" variant="contained" color="primary">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
