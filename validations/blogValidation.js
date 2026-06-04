const Joi = require("joi");

// ✅ Schema for fetch blogs (query validation)
exports.fetchBlogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  domain: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Domain is required",
      "string.empty": "Domain cannot be empty",
    }),

}).options({ stripUnknown: true });


// params validation
exports.slugParamSchema = Joi.object({
  slug: Joi.string().trim().min(1).required().messages({
    "string.empty": "Slug is required",
  }),
}).options({ stripUnknown: true });

// query validation (domain required)
exports.domainQuerySchema = Joi.object({
  domain: Joi.string().trim().required().messages({
    "any.required": "Domain is required",
    "string.empty": "Domain cannot be empty",
  }),
}).options({ stripUnknown: true });