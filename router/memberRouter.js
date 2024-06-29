const express = require("express");
const register = require("../controllers/Register");
const Member_path = require("../controllers/Member");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// router.post("/member/add/new", upload.fields([
//     { name: 'member_photo', maxCount: 1 },
  
// ]), register.signup);
// router.post("/member/add/new", register.signup);

router.get("/list",  Member_path.getMembers);
router.get("/:id", Member_path.SingleGetMemberById);
router.put("/details/update/:id", 
    upload.fields([{ name: "member_photo", maxCount: 1 }]),
    Member_path.UpdateMemberById);   



module.exports = router;
