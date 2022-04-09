const mongoose = require("mongoose");

const { MONGO_URI } = process.env;

exports.connect = () => { // we can use connect function from other modules
	// Connecting to the database
	mongoose.connect(MONGO_URI, null
		//{
			//useNewUrlParser: true,
			//useUnifiedTopology: true,
			//useCreateIndex: true,
			//useFindAndModify: false,
	//}
	)
	.then(() => {
		console.log(" ^v^ Successfully, connected to DB");
	})
	.catch(error => {
		console.log("T_T can not connect to DB, exiting now... bye");
		console.log(error);
		process.exit(1);
	});
};
