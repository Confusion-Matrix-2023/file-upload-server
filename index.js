const cors = require("cors");
const express = require("express");
const multer = require("multer");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const autofisSchema = new Schema({
  image_url: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  longitude: {
    type: String,
    required: true,
  },
  latitude: {
    type: String,
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
});

const ATLAS_URI = 'mongodb+srv://abc:YPcBYwaTd6WH6g1a@cluster0.yqewv.mongodb.net/autofis?retryWrites=true&w=majority';

const Autofis = mongoose.model(
  "autofis",
  autofisSchema
);

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'autofis',
  api_key: '336758519792364',
  api_secret: 'uuFzlzH2x084BQ2aEAmYEBxbdWc',
  secure: true
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

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.json({ "Hello": "World!" });
});

app.post("/api/upload", upload.single("file"), async (req, response) => {
  try {
    console.log(req.file.path);

    cloudinary.uploader.upload(`/home/runner/file-upload-server/${req.file.path}`, async function (err, res) {
      if (err) {
        console.error(err);
        return res.status(400).json({
          message: "Something went wrong!"
        })
      }

      console.log(res)

      const fish = new Autofis({
        image_url: res.secure_url,
        name: "",
        longitude: req.body.longitude,
        latitude: req.body.latitude,
        quantity: req.body.quantity,
        timestamp: req.body.timestamp
      })

      await fish.save()

      return response.status(200).json(fish);
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error!",
    });
  }
});

app.get("/api/history", async (req, res) => {
  const fish = await Autofis.find({})

  return res.status(200).json(fish);
})

mongoose
  .connect(ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((error) => console.log(error));

//creating and running server
app.listen(port, () => console.log(`server started on port ${port}`));
