//jshint esversion:8

require("dotenv").config();
require("./config/database").connect();

const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const express   = require("express");
const app       = express();
const User      = require("./model/user");
const auth      = require("./middleware/auth");

app.use(express.json());

//Register
app.post("/register", async (req, res) => {
	try {
		// Get user input
		const {firstName, lastName, email, password} = req.body;

		// Validate user input
		if (!(email && password && firstName && lastName)) {
			return res.status(400).send("All input is required");
		}

		// Check if user already exist in DB
		const oldUser = await User.findOne({ email });

		if (oldUser) {
			console.log("User exists");
			return res.status(409).send("User Already Exist. Please login");
		}

		// If new user => create new user in DB, but at first, we need to encrypt the
		// user's password
		encryptedPassword = await bcrypt.hash(password, 10);

		// Create user in DB
		const user = await User.create({
			first_name: firstName,
			last_name: lastName,
			email: email.toLowerCase(),
			password: encryptedPassword,
		});

		// Create token
		const token = jwt.sign(
			{
				user_id: user._id, email // _id is the id of user in db
			},
			process.env.TOKEN_KEY,
			{
				expiresIn: "5h",
			},
		);

		// Save user token
		user.token = token;

		// Return new user
		res.status(201).json(user);
	} catch (err) {
		console.log(err);
	}
});


//Login
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

// Welcome
app.post("/welcome", auth, (req, res) => {
	res.status(200).send("Welcome to Me ^*^");
}
);

module.exports = app;