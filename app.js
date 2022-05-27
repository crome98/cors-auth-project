//jshint esversion:8

require("dotenv").config();
// require("./config/database").connect(); // This is used for mongoose
const connPool          = require("./config/database").pool;
const bcrypt            = require("bcryptjs");
const jwt               = require("jsonwebtoken");
const express           = require("express");
const app               = express();
const auth              = require("./middleware/auth");
const validateUserInfo  = require("./validation/usersInfoValidation");

app.use(express.json()); // Loading middleware function express.json()
// ############################ Register ############################
app.post("/register", validateUserInfo, async (req, res) => {
	let conn;
	try {
    const data = {
      firstName: req.body.firstName,
      lastName : req.body.lastName,
      email    : req.body.email,
      password : req.body.password,
    };
		// Get connection to DB
		conn = await connPool.getConnection();
		if (!conn) {
			return res.status(500).send("Can not connect to DB");
		}
		// Check that this is new user or not
		const result = await conn.query(`SELECT * FROM users
			WHERE email = ?`, [data.email]);
		if (result.length > 0) {
			return res.status(400).send("User already exists, please login ^v^");
		}
		// encrypt user password before saving it to DB
		const encryptedPassword = await bcrypt.hash(data.password, 10);
		// Create token
		const token = jwt.sign(
				{
					firstName, email // _id is the id of user in db
				},
				process.env.TOKEN_SECRET,
				{
					expiresIn: "5h",
				},
		);
		// Create new user
		const insertResult = await conn.query(`INSERT INTO users
			(first_name, last_name, email, password, token)
			value (?, ?, ?, ?, ?)`, [data.firstName, data.lastName, data.email, encryptedPassword, token]);
		// Check if user is created
		if(insertResult.affectedRows === 1) {
			const userInfo = await conn.query(`SELECT * FROM users
				WHERE email = ?`, [email]);
			const user = userInfo[0];
			return res.status(200).json(user);
		} else {
			throw new Error("Register: Can not insert user to db!!!");
		}
	} catch (error) {
		return res.status(400).json(error);
	}
 	finally {
 			if (conn) {	conn.end(); } // Always close connection
 	}
});

// ############################ Login ############################
app.post("/login", async (req, res) => {
	let conn;
	try {
		const { email, password} = req.body;
		// Check inputs
		if (!(email && password)) {
			res.status(400).send("Both email and password are required");
		}
		// Get connection to DB
		conn = await connPool.getConnection();
		if (!conn) {
			return res.status(500).send("Can not connect to DB");
		}
		// Check that this is new user or not
		const result1 = await conn.query(`SELECT * FROM users
			WHERE email = ?`, [email]);
		if (result1.length === 0) { // If the first object in result array contains meta => User not exist!
			return res.status(400).send("User does not exist, please register T_T");
		}
		// Check if user already exist in DB
		const user = result1[0];
		if (await bcrypt.compare(password, user.password)) {
				// Create token
				const token = jwt.sign(
					{userName: user.firstName, email},
					process.env.TOKEN_SECRET,
					{
						expiresIn: "5h",
					}
				);
				const updateRs = await conn.query(`
					UPDATE users SET token = ?
					WHERE email = ?`, [token, email]);
				// Return user
				if (updateRs.affectedRows === 1) {
					console.log(`User: ${user.first_name} Login successful, new token: ${token}`);
					return res.status(200).json(user);
				} else {
					return res.status(400).send("Login: Could not update user token!!!");
				}
		}
		return res.status(400).send("Invalid Credentials");
	} catch (error) {
		return res.status(400).json(error);
	} finally {
		if (conn) { conn.end(); }
	}
});

// ############################ Delete ############################

app.delete("/deleteUser", async(req, res) => {
	let conn;
	try {
		const { email, password } = req.body;
		if (!(email && password)) {
			res.status(400).send("Both email and password are required");
		}
		// Get connection to DB
		conn = await connPool.getConnection();
		if (!conn) {
			return res.status(500).send("Can not connect to DB");
		}
		// Check that this is new user or not
		const result1 = await conn.query(`SELECT * FROM users
			WHERE email = ?`, [email]);
		if (result1.length === 0) { // If the first object in result array contains meta => User not exist!
			console.log(`${email} does not exist, please register T_T`);
			return res.status(400).send(`User with email ${email} does not exist, please register T_T`);
		}
		const user = result1[0];
		if (bcrypt.compare(password, user.password)) {
			const deleteResult = await conn.query(`
				DELETE FROM users WHERE email = ?`, [email]);
			console.log("Delete count", deleteResult);
			if (deleteResult.affectedRows === 1) {
				return res.status(200).send("Delete user Successfully ^_^");
			} else {
				return res.status(400).send("Can not delete user!!!");
			}
		}
		return res.status(400).send(`Delete user: password for user with email ${email} is not correct!!!`);
	} catch (err) {
		console.log(`Error: ${err}`);
		return res.status(400).json(err);
	} finally {
		if (conn) { conn.end(); }
	}
});

// ############################ Welcome ############################
app.post("/welcome", auth, (req, res) => {
	res.status(200).send("Welcome to Me ^*^");
}
);

// ############################ Patch ############################
app.patch("/updateUser", async(req, res) => {
	let conn;
	try {
		const { email, password, changes } = req.body;
		if (!(email && changes)) {
			res.status(400).send("Path method: email, password, and changes should be provided to patch!!!");
		}
		// Get connection to DB
		conn = await connPool.getConnection();
		if (!conn) {
			return res.status(500).send("Can not connect to DB");
		}
		// Check that this is new user or not
		const result1 = await conn.query(`SELECT * FROM users
			WHERE email = ?`, [email]);
		if (result1.length === 0) { // If the first object in result array contains meta => User not exist!
			console.log(`${email} does not exist, please register ^^`);
			return res.status(400).send(`User with email ${email} does not exist, please register T_T`);
		}
		const user = result1[0];
		if (bcrypt.compare(password, user.password)) {
			let cols = "";
			let sql = `UPDATE users set`;
			for (const key of Object.keys(changes)) {
				sql += ` ${key}=?`;
				if (Object.keys(changes).indexOf(key) !== Object.keys(changes).length - 1) {
						sql += ",";
				}
			}
			sql += ` where email='${email}'`;
			const updateResult = await conn.query(sql, [Object.values(changes)]);
			console.log(updateResult);
			if (updateResult) {
				return res.status(200).send("Updated");
			}
		}
		return res.status(400).send("Path method: User do not exist!!! Can not apply patch!!!");
	} catch (err) {
		console.log(err);
	} finally {
		if (conn) { conn.end(); }
	}
});

module.exports = app;
