const cors = require("cors");
const express = require("express");
const multer = require("multer");

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

app.get("/", (req, res) => {
  res.json({ "Hello": "World!" });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    console.log("file", req.file);
    console.log("req", JSON.stringify(req.body));
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
