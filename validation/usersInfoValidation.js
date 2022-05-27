//jshint esversion:8
const Joi = require("joi");

const validationRule = Joi.object()
  .keys({
    firstName: Joi.string()
      .min(3)
      .max(40)
      .required(),
		lastName: Joi.string()
	      .min(3)
	      .max(40)
	      .required(),
	  email: Joi.string()
				.email().trim(true).required(),
	  password: Joi.string()
				.min(6)
				.max(100)
				.required()
  });

const validateUsersInfo = async (req, res, next) => {
  const data = {
    firstName: req.body.firstName,
    lastName : req.body.lastName,
    email    : req.body.email,
    password : req.body.password,
  };
  const { error } = validationRule.validate(data);
  if (error) return res.status(400).json("User's data is not satisfied!!!");
  next(); // Call next middleware
};

module.exports = validateUsersInfo;
