// import { Request, Response, NextFunction } from "express";

// import LogController from "../Controller/logController";

// const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
//   const jwt_token = req.headers.authorization?.split(" ")[1] || null;
//   const user = req.user || null;

//   // Log the request using LogController
//   LogController.logRequest(req, user, jwt_token);

//   // Continue to the next middleware
//   next();
// };

// export default logMiddleware;

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import LogController from "../Controller/logController";

const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const jwt_token = req.headers.authorization?.split(" ")[1] || null;
  let user = null;

  // Decode the JWT token to extract user info (if token is present)
  if (jwt_token) {
    try {
      const secretKey = process.env.JWT_SECRET_KEY;
      if (secretKey) {
        // Decode JWT token using the same logic as authMiddleware
        const decoded = jwt.verify(jwt_token, secretKey) as {
          [key: string]: any;
        };

        // Assuming the user ID is in the 'user_id' field in the decoded token
        user = decoded;

        // console.log("Decoded user info in logMiddleware:", decoded); // Debugging purpose
      }
    } catch (error) {
      console.error("Error decoding token in logMiddleware:", error);
    }
  }

  // Log the request using LogController
  LogController.logRequest(req, user, jwt_token);

  // Continue to the next middleware or route handler
  next();
};

export default logMiddleware;
