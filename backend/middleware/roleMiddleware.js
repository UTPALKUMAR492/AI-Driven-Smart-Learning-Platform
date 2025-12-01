// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
};

// Check if user is teacher
export const isTeacher = (req, res, next) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin")
    return res.status(403).json({ message: "Teacher access required" });
  next();
};

// Check if user is teacher or admin (can create/manage courses)
export const isTeacherOrAdmin = (req, res, next) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin")
    return res.status(403).json({ message: "Teacher or Admin access required" });
  next();
};

// Check if user is not a student (teacher or admin)
export const isInstructor = (req, res, next) => {
  if (req.user.role === "student")
    return res.status(403).json({ message: "Instructors only" });
  next();
};

// Middleware to check ownership or admin
export const isOwnerOrAdmin = (Model) => async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    const isOwner = resource.instructor?.toString() === req.user._id.toString() ||
                    resource.createdBy?.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Not authorized to modify this resource" });
    }
    
    req.resource = resource;
    next();
  } catch (err) {
    res.status(500).json({ message: "Authorization check failed", error: err.message });
  }
};
