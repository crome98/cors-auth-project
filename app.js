//jshint esversion:8

require("dotenv").config();
// require("./config/database").connect(); // This is used for mongoose
const connPool  = require("./config/database").pool;
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const express   = require("express");
const app       = express();
const User      = require("./model/user");
const auth      = require("./middleware/auth");

app.use(express.json()); // Loading middleware function express.json()

// ############################ Register ############################
app.post("/register", async (req, res) => {
	let conn;
	try {
		// Get user input
		const {firstName, lastName, email, password} = req.body;

		// Validate user input
		if (!(email && password && firstName && lastName)) {
			return res.status(400).send("All input is required");
		}

		conn = await connPool.getConnection();
		if (!conn) {
			return res.status(500).send("Can not connect to DB");
		}

		// Check that this is new user or not
		const result = await conn.query(`SELECT * FROM users
			WHERE email = ?`, [email]);
		console.log(result.length);
		if (result.length > 0) { // If the first object in result array contains meta => User not exist!
			return res.status(400).send("User already exists, please login ^v^");
		}

		// encrypt user password before saving it to DB
		const encryptedPassword = await bcrypt.hash(password, 10);
		console.log(encryptedPassword.length);
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
		console.log(token.length);
		// Create new user
		const insertResult = await conn.query(`INSERT INTO users
			(first_name, last_name, email, password, token)
			value (?, ?, ?, ?, ?)`, [firstName, lastName, email, encryptedPassword, token]);

		if(insertResult.affectedRows === 1) {
			return res.status(200).send("Registered!!!");
		} else {
			throw new Error("Register: Can not insert user to db!!!");
		}
	} catch (error) {
		return res.status(400).send(error);
	}
 	finally {
 			if (conn) {	conn.end(); } // Always close connection
 	}
});

// ############################ Login ############################
app.post("/login", async (req, res) => {
	const { email, password} = req.body;

	// Check inputs
	if (!(email && password)) {
		res.status(400).send("Both email and password are required");
	}

	// Check if user already exist in DB
	const user = await User.findOne({ email });

	if (user && bcrypt.compare(password, user.password)) {
			// Create token
			const token = jwt.sign(
				{user_id: user._id, email},
				process.env.TOKEN_KEY,
				{
					expiresIn: "5h",
				}
			);

			// Save user token
			user.token = token;

			// Return user
			console.log(`User: ${user.first_name} Login successful, token will expire after ${token}`);
			return res.status(200).json(user);
	}
	return res.status(400).send("Invalid Credentials");

});

// ############################ Delete ############################

app.delete("/deleteUser", async(req, res) => {
	try {
		const { email, password } = req.body;
		console.log(email, password);
		if (!(email && password)) {
			res.status(400).send("Both email and password are required");
		}
		// Check if user already exist in DB
		const user = await User.findOne({ email });
		if (user && bcrypt.compare(password, user.password)) {
			const result = await user.deleteOne();
			console.log("Delete count", result);
			if (result !== null) {
				res.status(200).send("Delete user Successfully ^_^");
			}
		} else {
			res.status(400).send("User do not exist or wrong password!!!");
		}
	} catch (err) {
		console.log(err.message);
	}
});

// ############################ Welcome ############################
app.post("/welcome", auth, (req, res) => {
	res.status(200).send("Welcome to Me ^*^");
}
);

// ############################ Patch ############################
app.patch("/updateUser", async(req, res) => {
	try {
		const { email, password, changes } = req.body;
		if (!(email && changes)) {
			res.status(400).send("Path method: email is empty or there is no change to patch!!!");
		}
		// Check if user already exist in DB
		const user = await User.findOne({ email });
		if (user && bcrypt.compare(password, user.password)) {
			const doc = await User.findOneAndUpdate({ email }, changes);
			console.log(doc);
			if (doc) {
				return res.status(200).send(doc);
			}
		}
		return res.status(400).send("Path method: User do not exist!!! Can not apply patch!!!");
	} catch (err) {
		console.log(err);
	} finally {

	}
});


module.exports = app;
