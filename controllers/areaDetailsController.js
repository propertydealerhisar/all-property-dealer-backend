const AreaDetailes = require("../models/areaDetailes");

exports.getLocationsByCity = async (req, res) => {
  try {
    const { city } = req.params;

    console.log("City From Params =>", city);

    const locations = await AreaDetailes.find({
      city: { $regex: `^${city}$`, $options: "i" },
    }).select("city location slug");

    console.log("Matched Locations =>", locations);

    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    console.log("API Error =>", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};