const cors = require("cors");
const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const autofisSchema = new Schema({
  device_id: {
    type: String,
    required: true
  },
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
const JWT_SECRET = "f00t4f30321@@0439!2#@am"

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

const authMiddleware = (req, res, next) => {
  const bearerToken = req.headers["authorization"];
  if (bearerToken) {
    const token = bearerToken.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({
          message: "Invalid token"
        });
      } else {
        req.device_id = decoded;
        next();
      }
    });
  } else {
    res.status(401).json({
      message: "No token provided"
    });
  }
}


app.get("/", (req, res) => {
  res.json({ "Hello": "World!" });
});

app.post("/api/upload", authMiddleware, upload.single("file"), async (req, response) => {
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
        timestamp: req.body.timestamp,
        device_id: req.device_id
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

app.get("/api/history", authMiddleware, async (req, res) => {
  try {
    const fishes = await Autofis.find({
      device_id: req.device_id
    });
    res.status(200).json(fishes);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error!",
    });
  }
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
