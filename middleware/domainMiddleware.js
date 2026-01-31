module.exports = (req, res, next) => {
  let domain =
    req.params.domain || 
    req.headers["x-domain"] || 
    req.hostname;

  if (!domain) {
    return res.status(400).json({
      success: false,
      message: "Domain not provided",
    });
  }

  // normalize
  domain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");

  // DB me www ke saath save hai
  req.domain = `www.${domain}`;

  next();
};
