// ✅ Generic validation middleware (supports body, query, params)
module.exports = (schema, type = "body") => {
  return (req, res, next) => {
    let data;

    if (type === "query") data = req.query;
    else if (type === "params") data = req.params;
    else data = req.body;

    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    // ✅ Replace sanitized data back
    if (type === "query") req.query = value;
    else if (type === "params") req.params = value;
    else req.body = value;

    next();
  };
};