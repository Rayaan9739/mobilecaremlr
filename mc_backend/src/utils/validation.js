const Joi = require('joi');

const signupSchema = Joi.object({
  fullName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required(),
  password: Joi.string().min(6).required(),
  dob: Joi.date().less("now").required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const phoneLoginSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
});

const otpSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/)
}).or('email', 'phone');

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required(),
  // Optional: frontend may send token from /verify-dob
  resetToken: Joi.string().min(10).optional(),
});

const verifyDobSchema = Joi.object({
  email: Joi.string().email().required(),
  dob: Joi.date().less("now").required(),
});

const verifyUserSchema = Joi.object({
  email: Joi.string().email().required(),
  dob: Joi.date().less("now").required(),
});

const resetPasswordByIdSchema = Joi.object({
  userId: Joi.string().min(1).required(),
  newPassword: Joi.string().min(6).required(),
});

const productSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string().min(1).max(50).required()
});

const orderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).required()
  ,
  addressId: Joi.string().optional(),
  addressText: Joi.string().trim().min(3).max(500).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  setAsDefaultAddress: Joi.boolean().optional()
});

module.exports = {
  signupSchema,
  loginSchema,
  phoneLoginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyDobSchema,
  verifyUserSchema,
  resetPasswordByIdSchema,
  productSchema,
  orderSchema
};
