export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  COMPANY: 'company'
};

export const getRoleBasedRedirect = (role) => {
  switch(role) {
    case ROLES.STUDENT:
      return '/student';
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.COMPANY:
      return '/company';
    default:
      return '/login';
  }
};

export const hasPermission = (userRole, requiredRole) => {
  if (userRole === ROLES.ADMIN) return true;
  return userRole === requiredRole;
};