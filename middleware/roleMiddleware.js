function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.userRole?.toUpperCase();

    if (!userRole) {

      return res.status(403).json({ message: 'User role not found in token' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }


    next();
  };
}

module.exports = authorizeRoles;
 