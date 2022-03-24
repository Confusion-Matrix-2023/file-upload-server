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
  destination: function (req, file, callback) {
      callback(null, './uploads');
  },
  filename: function (req, file, callback) {
      callback(null, file.originalname);
  }
});

const upload = multer({ storage: storage});

async function getPredictions(imagePath) {
  if(model === undefined) {
    setTimeout(() => {
      getPredictions(imagePath);
    }, 100);
  }
  else {
    try {
      const image = await Jimp.read(`/home/runner/file-upload-server/${imagePath}`);
    
      image.cover(224, 224, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
    
      const NUM_OF_CHANNELS = 3;
    
      let values = new Float32Array(224 * 224 * NUM_OF_CHANNELS);
    
      let i = 0;
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        pixel.r = pixel.r / 127.0 - 1;
        pixel.g = pixel.g / 127.0 - 1;
        pixel.b = pixel.b / 127.0 - 1;
        pixel.a = pixel.a / 127.0 - 1;
        values[i * NUM_OF_CHANNELS + 0] = pixel.r;
        values[i * NUM_OF_CHANNELS + 1] = pixel.g;
        values[i * NUM_OF_CHANNELS + 2] = pixel.b;
        i++;
      });
    
      const outShape = [224, 224, NUM_OF_CHANNELS];
      let img_tensor = tf.tensor3d(values, outShape, 'float32');
      img_tensor = img_tensor.expandDims(0);
    
      const predictions = await model.predict(img_tensor).dataSync();
    
      for (let i = 0; i < predictions.length; i++) {
        const probability = predictions[i];
        console.log(`${probability}`);
      }
    }
    catch (err) {
      console.log(err);
    }
  }
}

app.get("/", (req, res) => {
  res.json({ "Hello": "World!" });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    console.log(req.file.path);
    await getPredictions(req.file.path);
    res.status(200).json({
      message: "success!",
    });
  } catch(err) {
    console.log(err);
    res.status(500).json({
      message: "error!",
    });
  }
});

//creating and running server
app.listen(port, () => console.log(`server started on port ${port}`));
