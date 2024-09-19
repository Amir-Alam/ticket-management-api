import { NextFunction, Request, Response } from "express";
import moment from "moment-timezone";
import { Pool } from "pg";

interface CreateTicektRequest extends Request {
  body: {
    title: string;
    description: string;
    type: string;
    venue: string;
    status: string;
    price: number;
    priority: string;
    dueDate: string;
    createdBy: string;
  };
}

interface AssignUserToTicket extends Request {
  body: {
    userId: number;
  };
  params: {
    ticketId: string;
  };
}

interface getTicketDetails extends Request {
  params: {
    ticketId: string;
  };
}
class TicketController {
  static pool: Pool;

  static initializePool(pool: Pool) {
    TicketController.pool = pool;
  }

  //------------------------------------> CREATE TICKETS FUNCTION HERE ----------------------------------------------------->

  static createTicketController = async (
    req: CreateTicektRequest,
    res: Response,
    next: NextFunction
  ) => {
    const {
      title,
      description,
      type,
      venue,
      status,
      price,
      priority,
      dueDate,
      createdBy,
    } = req.body;

    const pool = TicketController.pool;

    try {
      // Checking if the user is authenticated
      if (!req.user) {
        return res.status(400).json({ message: "Unauthorized user." });
      }

      // Checking if all required fields are present
      if (
        !title ||
        !description ||
        !type ||
        !venue ||
        !status ||
        !price ||
        !priority ||
        !dueDate ||
        !createdBy
      ) {
        return res
          .status(400)
          .json({ message: "Required parameters are missing." });
      }

      // Validate status
      const validStatus = ["open", "in-progress", "closed"];
      if (!validStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid Status Type!" });
      }

      // Validate priority
      const validPriority = ["low", "medium", "high"];
      if (!validPriority.includes(priority)) {
        return res.status(400).json({ message: "Invalid priority Type!" });
      }

      // Validate due date
      const currentTime = moment.tz("Asia/Kolkata");
      const dueDateTime = moment(dueDate);
      if (!dueDateTime.isValid() || dueDateTime.isBefore(currentTime)) {
        return res
          .status(400)
          .json({ message: "Due date must be a future date." });
      }

      // Check if the user exists in the database
      const userQuery = "SELECT * FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [createdBy]);

      if (userResult.rows.length !== 1) {
        return res.status(400).json({ message: "Invalid ID." });
      }

      // Insert the ticket into the database
      const insertQuery = `INSERT INTO tickets (title, description, type, venue, status, price, priority, due_date, created_by)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                           RETURNING ticket_id, title, description, type, venue, status, priority, due_date, created_by`;

      const queryValues = [
        title,
        description,
        type,
        venue,
        status,
        price,
        priority,
        dueDate,
        createdBy,
      ];

      const result = await pool.query(insertQuery, queryValues);

      // Return the created ticket data
      res.status(201).json({
        ...result.rows[0],
        assignedUsers: [], // Assuming no initial users are assigned
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error." });
    }
  };

  //------------------------------------> ASSIGN particular ticket to particular user_id ------------------------------------>

  static assignTicketController = async (
    req: AssignUserToTicket,
    res: Response,
    next: NextFunction
  ) => {
    const { ticketId } = req.params;
    const { userId } = req.body;
    const pool = TicketController.pool;

    try {
      // Checking if the required parameters are present
      if (!ticketId || !userId) {
        return res
          .status(400)
          .json({ message: "Required parameters are missing." });
      }

      // Fetch the ticket details
      const ticketQuery = `SELECT * FROM tickets WHERE ticket_id = $1`;
      const ticketResult = await pool.query(ticketQuery, [ticketId]);

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ message: "Ticket not found." });
      }

      const ticket = ticketResult.rows[0];

      // Check if the ticket is closed
      if (ticket.status === "closed") {
        return res
          .status(400)
          .json({ message: "Cannot assign users to a closed ticket." });
      }

      // Fetch the user making the request (from the JWT in req.user) to check their type
      const requestUserId = req.user.userID;
      const requestUserQuery = `SELECT type FROM users WHERE user_id = $1`;
      const requestUserResult = await pool.query(requestUserQuery, [
        requestUserId,
      ]);

      if (requestUserResult.rows.length === 0) {
        return res
          .status(400)
          .json({ message: "Requesting user does not exist." });
      }

      const requestUser = requestUserResult.rows[0];

      // Check if the requesting user is an admin or the ticket creator
      const isAdmin = requestUser.type === "admin";
      const isTicketCreator = requestUserId === ticket.created_by;

      if (!isAdmin && !isTicketCreator) {
        return res.status(403).json({ message: "Unauthorized user." });
      }

      // Validate the user we are assigning to the ticket
      const userQuery = `SELECT user_id, name, email, type FROM users WHERE user_id = $1`;
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "User does not exist." });
      }

      const user = userResult.rows[0];

      // Check if the user is an admin (admins cannot be assigned to tickets)
      if (user.type === "admin") {
        return res
          .status(400)
          .json({ message: "Cannot assign ticket to an Admin." });
      }

      // Fetching the list of assigned users
      let assignedUsers = ticket.assigned_users ? ticket.assigned_users : [];

      // Ensure assignedUsers is an array
      if (!Array.isArray(assignedUsers)) {
        assignedUsers = JSON.parse(assignedUsers);
      }

      // Check if the user is already assigned to the ticket
      if (assignedUsers.some((u: any) => u.userId === userId)) {
        return res
          .status(400)
          .json({ message: "User already assigned to this ticket." });
      }

      // Check if the maximum assigned user limit (5) is reached
      const maxUserLimit = 5;
      if (assignedUsers.length >= maxUserLimit) {
        return res
          .status(400)
          .json({ message: "Maximum number of users assigned." });
      }

      // Assign the user to the ticket
      const userDetails = {
        userId: user.user_id,
        name: user.name,
        email: user.email,
      };

      assignedUsers.push(userDetails);

      // Ensure the assignedUsers array is correctly formatted
      const updateQuery = `UPDATE tickets SET assigned_users = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2`;
      await pool.query(updateQuery, [JSON.stringify(assignedUsers), ticketId]);

      return res.status(200).json({ message: "User assigned successfully." });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error });
    }
  };

  //-----------------------------------> FETCH particular ticket based on ticket_id ---------------------------------------->
  static ticketDetailsController = async (
    req: getTicketDetails,
    res: Response,
    next: NextFunction
  ) => {
    const { ticketId } = req.params;

    const pool = TicketController.pool;

    if (!ticketId) {
      return res.status(400).json({ message: "Enter the ticket number" });
    }

    try {
      const ticketQuery = `SELECT * FROM tickets WHERE ticket_id = $1`;
      const ticketFetch = await pool.query(ticketQuery, [ticketId]);
      if (ticketFetch.rows.length === 0) {
        return res.status(404).json({ message: "Ticket not found." });
      }

      const ticketResult = ticketFetch.rows[0];

      res.status(200).json({
        message: "Ticket details fetched successfully,",
        ticketResult,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal Server Error.", error: error });
    }
  };
}

export default TicketController;
