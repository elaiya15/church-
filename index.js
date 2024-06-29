const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
const cors = require("cors");
require("dotenv").config();
const auth = require("./models/auth");

const login= require("./router/loginRoutes")
const member_register= require("./router/registerRoutes")
const member= require("./router/memberRouter")
const family_member= require("./router/familyRouter")
const offering= require("./router/offeringsRouter")
const expense= require("./router/expenseRouter")
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DataBase Connected"))
  .catch((err) => {
    console.log(err);
  });
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
 res.send(" Server Running ");
});
app.use("/api", login);
// Serve uploaded images statically
app.use('/api/uploads',auth.isAuthenticated,express.static(path.join(__dirname, 'uploads')));
app.use("/api/", auth.authenticateUser);
app.use("/api/member", member);
app.use("/api/family", family_member);
app.use("/api/offerings", offering);
app.use("/api/expense", expense);

// Connect to MongoDB
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  // console.log(`Server is running on http://localhost:${PORT}`);
});
