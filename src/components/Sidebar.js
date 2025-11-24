import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import BookIcon from '@mui/icons-material/Book';
import TimerIcon from '@mui/icons-material/Timer';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

    const navItems = [
        { path: '/', icon: <DashboardIcon />, label: 'Dashboard' },
        { path: '/calendar', icon: <CalendarTodayIcon />, label: 'Calendar' },
        { path: '/statistics', icon: <BarChartIcon />, label: 'Statistics' },
        { path: '/blogs', icon: <BookIcon />, label: 'Journal' },
        { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
    ];

    return (
        <Box
            sx={{
                width: '280px',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(10, 10, 15, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 1200,
                padding: '24px',
            }}
        >
            {/* Logo Area */}
            <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                    }}
                >
                    <TimerIcon sx={{ color: 'white' }} />
                </Box>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                    }}
                >
                    GoalTracker
                </Typography>
            </Box>

            {/* Navigation */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={{ textDecoration: 'none' }}
                    >
                        {({ isActive }) => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    transition: 'all 0.3s ease',
                                    background: isActive
                                        ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)'
                                        : 'transparent',
                                    border: isActive
                                        ? '1px solid rgba(139, 92, 246, 0.2)'
                                        : '1px solid transparent',
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        transform: 'translateX(4px)',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        color: isActive ? '#a78bfa' : 'rgba(255, 255, 255, 0.5)',
                                        display: 'flex',
                                        transition: 'color 0.3s ease',
                                    }}
                                >
                                    {item.icon}
                                </Box>
                                <Typography
                                    sx={{
                                        color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.95rem',
                                        transition: 'color 0.3s ease',
                                    }}
                                >
                                    {item.label}
                                </Typography>
                                {isActive && (
                                    <Box
                                        sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#ec4899',
                                            marginLeft: 'auto',
                                            boxShadow: '0 0 10px #ec4899',
                                        }}
                                    />
                                )}
                            </Box>
                        )}
                    </NavLink>
                ))}
            </Box>

            {/* User Profile */}
            <Box
                sx={{
                    mt: 'auto',
                    p: 2,
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        border: '2px solid rgba(255,255,255,0.1)',
                    }}
                >
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff' }}>
                        {user?.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Free Plan
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Sidebar;
