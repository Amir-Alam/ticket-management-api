import { Request } from "express";
import { Pool } from "pg";
import moment from "moment-timezone";
import { Address6 } from "ip-address";

let pool: Pool;

const LogController = {
  initializePool: (dbPool: Pool) => {
    pool = dbPool;
  },

  logRequest: async (req: Request, user: any, jwt_token: string | null) => {
    try {
      // Get current time in IST
      const currentTimeIST = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");

      // Get IP address (supporting both IPv4 and IPv6)
      let ip_addr: string | null = null;

      if (req.headers["x-forwarded-for"]) {
        // If x-forwarded-for exists, it can be a string or string[]
        const forwarded = req.headers["x-forwarded-for"];
        ip_addr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      } else {
        // Fallback to req.socket.remoteAddress
        ip_addr = req.socket.remoteAddress || null;
      }

      // Ensure ip_addr is a string before processing further
      if (ip_addr && typeof ip_addr === "string" && ip_addr.includes(":")) {
        // Use Address6 static method to validate if it's an IPv6 address
        if (Address6.isValid(ip_addr)) {
          const address6 = new Address6(ip_addr);
          const ipv4 = address6.to4(); // Convert to IPv4 if it's IPv6-mapped
          ip_addr = ipv4 ? ipv4.address : ip_addr; // If conversion succeeds, store the IPv4 address
        }
      }

      // Get user agent and referrer from request headers
      const userAgent = req.headers["user-agent"] || null;
      const referer = req.headers["referer"] || null;

      // Insert log into PostgreSQL
      const query = `
        INSERT INTO user_logs (
          user_id, jwt_token, method, path, ip_addr, timestamp, request_body, user_agent, referer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const values = [
        user ? user.userID : null,
        jwt_token,
        req.method,
        req.originalUrl,
        ip_addr,
        currentTimeIST,
        req.body,
        userAgent,
        referer,
      ];

      await pool.query(query, values);
    } catch (error) {
      console.error("Error logging request:", error);
    }
  },
};

export default LogController;
