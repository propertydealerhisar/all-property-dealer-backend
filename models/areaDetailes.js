const mongoose = require('mongoose');

const localitySchema = new mongoose.Schema({
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    pinCode: {
        type: String,
    },
    aboutLocality: {
        type: [String], // Array of HTML paragraph strings	
    },
    highlights: { type: String },

    facilities: [
        {
            heading: String,
            list: [String]
        }
    ],
    whyChoose: {
        heading: { type: String }, // Main heading	
        description: { type: String }, // Intro paragraph	

        sections: [
            {
                title: { type: String }, // e.g. "1. Strategic Location and Excellent Connectivity"	
                description: { type: String },
                points: [{
                    title: { type: String },
                    lists: [{ type: String }]
                }], // list of bullet points under that section	
                text: { type: String }
            }
        ],

        conclusion: {
            title: { type: String },
            text: { type: String }
        },

        tips: [
            {
                title: { type: String },
                points: [{ type: String }]
            }
        ]
    },
    faqs: [
        {
            question: String,
            answer: String
        }
    ],
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    metatitle: { type: String, trim: true },
    metadescription: { type: String, trim: true },
    citymetatitle: { type: String, trim: true },
    citymetadescription: { type: String, trim: true },

}, { timestamps: true });

module.exports = mongoose.model(
  "areaDetailes",
  localitySchema,
  "areaDetailes"
);