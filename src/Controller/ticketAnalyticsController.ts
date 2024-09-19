import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import moment from "moment-timezone";

interface TicketAnalyticsRequest extends Request {
  body: {
    startDate: string;
    endDate: string;
  };
}

class TicketAnalyticsController {
  static pool: Pool;

  static initializePool(pool: Pool) {
    TicketAnalyticsController.pool = pool;
  }

  //------------------------------------------> FETCHING TICKET ANALYTICS FUNCTION HERE ----------------------------------------------------->

  static getTicketAnalytics = async (
    req: TicketAnalyticsRequest,
    res: Response,
    next: NextFunction
  ) => {
    const pool = TicketAnalyticsController.pool;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ message: "Required parameters are missing." });
      return;
    }

    // Query to get the total number of ticket count
    const totalQuery = `SELECT COUNT(*) AS totaltickets FROM tickets
                        WHERE created_at BETWEEN $1 AND $2`;
    const totalResult = await pool.query(totalQuery, [startDate, endDate]);

    const totalTickets = parseInt(totalResult.rows[0].totaltickets) || 0;

    // Query to get the total count of STATUS
    const statusQuery = `SELECT status, COUNT(*) AS COUNT FROM tickets
                         WHERE created_at BETWEEN $1 AND $2 
                         GROUP BY status 
                         ORDER BY status`;
    const statusResult = await pool.query(statusQuery, [startDate, endDate]);

    // Query to get the total of PRIORITY count
    const priorityQuery = `SELECT priority, COUNT(*) AS COUNT FROM tickets
                           WHERE created_at BETWEEN $1 AND $2 
                           GROUP BY priority 
                           ORDER BY priority`;
    const priorityResult = await pool.query(priorityQuery, [
      startDate,
      endDate,
    ]);

    // Query to get the total of TYPE count
    const typeQuery = `SELECT type, COUNT(*) AS COUNT FROM tickets
                       WHERE created_at BETWEEN $1 AND $2 
                       GROUP BY type 
                       ORDER BY type`;
    const typeResult = await pool.query(typeQuery, [startDate, endDate]);

    // Query to FETCH ALL TICKETS between startDate and endDate
    const detailsQuery = `SELECT * FROM tickets WHERE created_at BETWEEN $1 AND $2`;
    const detailsResult = await pool.query(detailsQuery, [startDate, endDate]);

    // Creating the statusDistribution and other ticket counts
    let closedTickets = 0;
    let openTickets = 0;
    let inProgressTickets = 0;

    statusResult.rows.forEach((row) => {
      const status = row.status.toLowerCase();
      const count = parseInt(row.count);

      if (status === "closed") {
        closedTickets = count;
      } else if (status === "open") {
        openTickets = count;
      } else if (status === "in-progress") {
        inProgressTickets = count;
      }
    });

    // Creating the PRIORITY Distribution
    const priorityDistribution: Record<string, number> = {};
    priorityResult.rows.forEach((row) => {
      priorityDistribution[row.priority.toLowerCase()] = parseInt(row.count);
    });

    // Creating TYPE Distribution
    const typeDistribution: Record<string, number> = {};
    typeResult.rows.forEach((row) => {
      typeDistribution[row.type] = parseInt(row.count);
    });

    // Preparing the final response
    const response = {
      totalTickets,
      closedTickets,
      openTickets,
      inProgressTickets,
      priorityDistribution,
      typeDistribution,
      ticketDetails: detailsResult.rows,
    };

    res.status(200).json(response);
  };

  //------------------------------------------> DASHBOARD TICKET ANALYTICS FUNCTION HERE ----------------------------------------------------->

  static getTicketDashboardAnalytics = async (
    req: TicketAnalyticsRequest,
    res: Response,
    next: NextFunction
  ) => {
    const { startDate, endDate } = req.body;
    const pool = TicketAnalyticsController.pool;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Required parameters are missing." });
    }

    try {
      // Calculating total number of days between startDate and endDate
      const start = moment(startDate);
      const end = moment(endDate);
      const totalDays = end.diff(start, "days") + 1;

      if (totalDays <= 0) {
        return res.status(400).json({ message: "Invalid date range." });
      }

      // Fetch total tickets
      const totalQuery = `
        SELECT COUNT(*) AS totalTickets FROM tickets
        WHERE created_at BETWEEN $1 AND $2
      `;
      const totalResult = await pool.query(totalQuery, [startDate, endDate]);
      const totalTickets = parseInt(totalResult.rows[0].totaltickets) || 0;

      // Fetch average customer spending
      const avgSpendingQuery = `
        SELECT AVG(price) AS averageCustomerSpending FROM tickets
        WHERE created_at BETWEEN $1 AND $2
      `;
      const avgSpendingResult = await pool.query(avgSpendingQuery, [
        startDate,
        endDate,
      ]);

      //Calculating the average the price of the ticket booked
      const averageCustomerSpending = parseFloat(
        (
          parseFloat(avgSpendingResult.rows[0].averagecustomerspending) || 0
        ).toFixed(2)
      );

      // Calculate average tickets booked per day
      const AverageTicketsBookedPerDay = totalTickets / totalDays;

      // Fetch status counts
      const statusQuery = `
        SELECT status, COUNT(*) AS count FROM tickets
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY status
        ORDER BY status
      `;
      const statusResult = await pool.query(statusQuery, [startDate, endDate]);

      let closedTickets = 0;
      let openTickets = 0;
      let inProgressTickets = 0;

      statusResult.rows.forEach((row) => {
        const count = parseInt(row.count);
        const status = row.status.toLowerCase();
        if (status === "closed") {
          closedTickets = count;
        } else if (status === "open") {
          openTickets = count;
        } else if (status === "in progress") {
          inProgressTickets = count;
        }
      });

      // Fetch priority distribution and calculate averages per day
      const priorityQuery = `
        SELECT priority, COUNT(*) AS count FROM tickets
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY priority
        ORDER BY priority
      `;
      const priorityResult = await pool.query(priorityQuery, [
        startDate,
        endDate,
      ]);

      let averageLowTicketsBookedPerDay = 0;
      let averageMediumTicketsBookedPerDay = 0;
      let AverageHighTicketsBookedPerDay = 0;

      const priorityCounts: Record<string, number> = {};

      priorityResult.rows.forEach((row) => {
        const count = parseInt(row.count);
        const priority = row.priority.toLowerCase();

        priorityCounts[priority] = count;

        const averagePerDay = count / totalDays;

        if (priority === "low") {
          averageLowTicketsBookedPerDay = averagePerDay;
        } else if (priority === "medium") {
          averageMediumTicketsBookedPerDay = averagePerDay;
        } else if (priority === "high") {
          AverageHighTicketsBookedPerDay = averagePerDay;
        }
      });

      // Construct priorityDistribution object
      const priorityDistribution = {
        low: priorityCounts["low"] || 0,
        averageLowTicketsBookedPerDay,
        medium: priorityCounts["medium"] || 0,
        averageMediumTicketsBookedPerDay,
        high: priorityCounts["high"] || 0,
        AverageHighTicketsBookedPerDay,
      };

      // Fetch type distribution
      const typeQuery = `
        SELECT type, COUNT(*) AS count FROM tickets
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY type
        ORDER BY type
      `;
      const typeResult = await pool.query(typeQuery, [startDate, endDate]);

      const typeDistribution: Record<string, number> = {};
      typeResult.rows.forEach((row) => {
        typeDistribution[row.type] = parseInt(row.count);
      });

      // Return the final result
      const response = {
        totalTickets,
        closedTickets,
        openTickets,
        inProgressTickets,
        averageCustomerSpending,
        AverageTicketsBookedPerDay,
        priorityDistribution,
        typeDistribution,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching ticket analytics:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
}

export default TicketAnalyticsController;
