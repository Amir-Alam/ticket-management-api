import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Express Request interface to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extract token from headers
  const token = req.headers.authorization?.split(" ")[1]; // Assuming 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    // Verify token
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error("JWT secret key is not defined");
    }

    const decoded = jwt.verify(token, secretKey);

    // Attach decoded user info to request
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
