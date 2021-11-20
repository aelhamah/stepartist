var { ObjectId } = require("mongodb").ObjectId;
const express = require("express");

// stepArtistRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /listings.
const stepArtistRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/conn");

// Start a drawing
stepArtistRoutes.route("/getDrawingId").get(async function (req, res) {
  const dbConnect = dbo.getDb();
  const drawingDocument = {
    drawing: []
  };

  dbConnect
    .collection("drawings")
    .insertOne(drawingDocument, function (err, result) {
      if (err) {
        res.status(400).send("Error creating drawing!");
      } else {
        console.log(`Created a new drawing with id ${result.insertedId}`);
        res.status(200).send(result.insertedId.toString());
      }
    });
});

// Add a path to an existing drawing
/*
Example post request body:
{
    "id": "6199667213030f0eec9ce568",
    "color": "#FF0000",
    "weight": 1.0,
    "coordinates": [
        {"lat":1, "lng":0},
        {"lat":2, "lng":0}
    ]
}
*/
stepArtistRoutes.route("/addPath").post(function (req, res) {
  const dbConnect = dbo.getDb();
  const drawingQuery = { _id: new ObjectId(req.body.id) };
  const updates = {
    $push: {
      drawing: {
        color: req.body.color,
        weight: req.body.weight,
        coordinates: req.body.coordinates
      }
    }
  };

  dbConnect
    .collection("drawings")
    .updateOne(drawingQuery, updates, function (err, _result) {
      if (err) {
        res.status(400).send(`Error updating drawing with id ${drawingQuery._id}!`);
      } else {
        res.status(200).send("1 document updated")
      }
    });
});

// Get all the paths of a drawing
stepArtistRoutes.route("/getPaths/:drawingId").get(async function (req, res) {
  const dbConnect = dbo.getDb();
  const drawingQuery = { _id: new ObjectId(req.params.drawingId) };

  dbConnect
    .collection("drawings")
    .findOne(drawingQuery, function (err, result) {
      if (err) {
        res.status(400).send("Error fetching listings!");
      } else {
        res.json(result.drawing);
      }
    });
});

module.exports = stepArtistRoutes;
