// Route permission configuration
export const routePermissions = {
    // Student routes
    '/student': ['student'],
    '/student/profile': ['student'],
    '/student/placements': ['student'],
    '/student/internships': ['student'],
    '/student/applications': ['student'],
    '/student/eligibility': ['student'],
    '/student/history': ['student'],

    // Admin routes
    '/admin': ['admin'],
    '/admin/students': ['admin'],
    '/admin/companies': ['admin'],
    '/admin/drives': ['admin'],
    '/admin/applications': ['admin'],
    '/admin/analytics': ['admin'],
    '/admin/notices': ['admin'],
    '/admin/reports': ['admin'],

    // Company routes
    '/company': ['company'],
    '/company/post-job': ['company'],
    '/company/post-internship': ['company'],
    '/company/applicants': ['company'],
    '/company/shortlist': ['company'],
};

// Check if user has permission to access a route
export const hasRoutePermission = (path, userRole) => {
    // Find matching route pattern
    const matchedRoute = Object.keys(routePermissions).find(route =>
        path.startsWith(route)
    );

    if (!matchedRoute) return false;
    return routePermissions[matchedRoute].includes(userRole);
};

// Get default redirect for user role
export const getDefaultRedirect = (userRole) => {
    switch (userRole) {
        case 'student':
            return '/student';
        case 'admin':
            return '/admin';
        case 'company':
            return '/company';
        default:
            return '/login';
    }
};