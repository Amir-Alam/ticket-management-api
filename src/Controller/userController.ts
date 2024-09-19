import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import moment from "moment-timezone";

interface RegisterUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    type: string;
  };
}

interface LoginUserRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

class UserController {
  static pool: Pool;

  static initializePool(pool: Pool) {
    UserController.pool = pool;
  }

  //------------------------------------------> USER REGISTER FUNCTION HERE ------------------------------------------------->

  static userRegister = async (
    req: RegisterUserRequest,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, password, type } = req.body;
    const pool = UserController.pool;

    try {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid Email Format!" });
      }

      // Checking if the email already exists
      const emailQuery = "SELECT * FROM users WHERE email = $1";
      const emailResult = await pool.query(emailQuery, [email]);

      if (emailResult.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists." });
      }

      // Password CRITERIA validation
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long & consist of special characters and numbers.",
        });
      }

      // Validating the user type
      const validUser = ["admin", "customer"];

      if (!validUser.includes(type)) {
        return res.status(400).json({ message: "Invalid User Type!" });
      }

      // Hashing the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Getting the current time in IST format
      const currentTime = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");

      // Writing query for inserting data into table of new user
      const insertQuery = `
        INSERT INTO users (name, email, password, type, active_flag, registered_on, plain_password)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING user_id, name, email
      `;

      // Inserting the values(data) in the query
      const values = [
        name,
        email,
        hashedPassword,
        type,
        1,
        currentTime,
        password,
      ];

      // Inserting the new user into the database
      const result = await pool.query(insertQuery, values);

      res.status(201).json({
        message: "User created successfully",
        user_id: result.rows[0].user_id,
        name: result.rows[0].name,
        email: result.rows[0].email,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error_message: error });
    }
  };

  //------------------------------------------> USER LOGIN FUNCTION HERE ----------------------------------------------------->

  static userLogin = async (
    req: LoginUserRequest,
    res: Response,
    Next: NextFunction
  ): Promise<void> => {
    const { email, password } = req.body;
    const pool = UserController.pool;

    try {
      //checking if email & password are present in request body
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
      }

      //checking if user (email) exists or not
      const emailQuery = "SELECT * FROM users WHERE email = $1";
      const emailResult = await pool.query(emailQuery, [email]);

      if (emailResult.rows.length === 0) {
        res.status(404).json({ message: "User not found." });
      }

      //fetching the user and comparing the active_flag and password
      const user = emailResult.rows[0];

      //checking if user is active or deactive
      if (user.active_flag !== 1) {
        res.status(400).json({
          message:
            "Account has been deactivated. Kindly contact the administrator.",
        });
      }

      //checking if password is correct or not
      const passwordIsMatch = await bcrypt.compare(password, user.password);
      if (!passwordIsMatch) {
        res.status(400).json({ message: "Invalid password." });
      }

      const currentTime = moment
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");

      //generating jwt token after verifying the user details
      const token =
        user.jwt_token ||
        jwt.sign(
          { user_id: user.user_id },
          process.env.JWT_SECRET_KEY || "secret"
        );

      //Query to update the jwt_token and last_login field of the user.
      const loginUpdateQuery = `UPDATE users SET jwt_token = $1, last_login = $2
                                WHERE user_id = $3 RETURNING jwt_token, last_login`;

      const loginUpdateValues = [token, currentTime, user.user_id];
      const updateLogin = await pool.query(loginUpdateQuery, loginUpdateValues);

      const updatedUser = updateLogin.rows[0];

      res.status(200).json({
        message: "Login Successfull !!",
        token: updatedUser.jwt_token,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
}

export default UserController;
