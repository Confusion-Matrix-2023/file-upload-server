const cors = require("cors");
const express = require("express");
const multer = require("multer");
const fs = require('fs');
const Jimp = require('jimp');

const tf = require('@tensorflow/tfjs-node');

tf.loadLayersModel('file://model/model.json').then((model) => {
  global.model = model;
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}))
require("dotenv").config();

const port = process.env.PORT || 5000;

const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, './uploads');
  },
  filename: function(req, file, callback) {
    callback(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const d = [
  'Black Sea Sprat',
  'Gilt-Head Bream',
  'Hourse Mackerel',
  'Red Mullet',
  'Red Sea Bream',
  'Sea Bass',
  'Shrimp',
  'Striped Red Mullet',
  'Trout'
];

async function generatePredictions(imagePath) {
  try {
    const image = await Jimp.read(`/home/runner/file-upload-server/${imagePath}`);

    const buffer = await image.getBufferAsync(Jimp.MIME_PNG)

    var tensor = tf.tidy(() => {
      return tf.node.decodeImage(buffer, 3).resizeNearestNeighbor([224, 224])
        .toFloat();
    });

    let offset = tf.scalar(127.5);

    tensor = tensor.sub(offset)
      .div(offset)
      .expandDims();

    let predictions = await model.predict(tensor).data();

    let results = Array.from(predictions)
      .map(function(p, i) {
        return {
          className: d[i],
          probability: p,
        };
      }).sort(function(a, b) {
        return b.probability - a.probability;
      }).slice(0, 5);

    console.log(results);

  } catch (err) {
    console.log(err);
  }

}

app.get("/", (req, res) => {
  res.json({ "Hello": "World!" });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    console.log(req.file.path);
    await generatePredictions(req.file.path);
    res.status(200).json({
      message: "success!",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error!",
    });
  }
});

//creating and running server
app.listen(port, () => console.log(`server started on port ${port}`));
