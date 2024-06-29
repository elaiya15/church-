const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const generateMemberCode = require("../util/MemberCodeGenerate");
const generateFamilyCode = require("../util/FamilyId");

// Get All Member list
exports.getMembers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;

  try {
    const MemberData = await Member.find()
    .sort({ createdAt: -1 })
      .select(
        "member_id primary_family_id secondary_family_id member_name status"
      )
      .skip((page - 1) * limit)
      .limit(limit);

    const totalItems = await Member.countDocuments();
    const TotalPages = Math.ceil(totalItems / limit);

    let RegisteredData = [];
    // console.log(RegisteredData);

    for (const Members of MemberData) {
      const familyMembers = await Family.findOne({
        $or: [
          { family_id: Members.secondary_family_id },
          { family_id: Members.primary_family_id },
        ],
      }).select("family_id head");

      const family_head = await Member.findOne({
        member_id: familyMembers.head,
      }).select(" member_name");

      // Combine the family and member information
      if (familyMembers && family_head) {
        RegisteredData.push({
          member_id: Members.member_id,
          member_name: Members.member_name,
          family_id: familyMembers.family_id,
          family_head_name: family_head.member_name,
          status: Members.status,
        });
      }
      // console.log(RegisteredData);
    }

    return res.json({
      message: "Get Member Data Successful",
      RegisteredData,
      totalItems,
      TotalPages,
      currentPage: page,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch members", error: error.message });
  }
};

// get single member
exports.SingleGetMemberById = async (req, res) => {
  try {
    const member = await Member.findOne({ member_id: req.params.id }).lean();

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    let familyMembers;
    if (member.secondary_family_id !== null) {
      familyMembers = await Family.findOne({
        family_id: member.secondary_family_id,
      }).select("head members");
    } else if (member.primary_family_id !== null) {
      familyMembers = await Family.findOne({
        family_id: member.primary_family_id,
      }).select("head members");
    }

    // const familyMembers = await Family.findOne({
    //   $or: [
    //     { family_id: member.secondary_family_id },
    //     { family_id: member.primary_family_id },
    //   ],
    // }).select("head members");
    // // console.log("familyMembers.head:", familyMembers.head);

    if (familyMembers !== null) {
      if (familyMembers.head === req.params.id) {
        member.family_head = true;
      } else {
        for (const family of familyMembers.members) {
          if (family.ref_id === req.params.id) {
            member.relationship_with_family_head =
              family.relationship_with_family_head;
            // console.log(family.relationship_with_family_head);
          }
        }
        const member_head = await Member.findOne({
          member_id: familyMembers.head,
        })
          .select("member_name")
          .lean();
        // console.log("member_head:", member_head);
        if (!member_head) {
          return res.status(404).json({ message: "Member Head not found" });
        }
        member.family_head_name = member_head.member_name;
        // console.log(member.member_id);
      }
    }
    return res.status(200).json(member);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch member", error: error.message });
  }
};

exports.UpdateMemberById = async (req, res) => {
  const id = req.params.id;
  try {
    const member = await Member.findOne({
      member_id: id,
    }).lean();

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    if (req.files.member_photo === undefined) {
      delete req.body.member_photo;
    } else {
      const member_photo = req.files?.member_photo?.[0]?.buffer || null;
      req.body.member_photo = member_photo;
    }

    if (req.body.marriage_date !== undefined || req.body.marriage_date !== "") {
      console.log("marriage_date true");
      if (req.body.gender !== "Female") {
        const familyMembers = await Family.find({
          head: id,
        });
        console.log("gender male");
        if (familyMembers.length === 0) {
          console.log("head null");
          const family_id = await generateFamilyCode();
          const newFamily = new Family({
            family_id: family_id,
            head: id,
            members: [],
          });
          const savedFamily = await newFamily.save();
          req.body.secondary_family_id = family_id;
          const updateMember = await Member.findOneAndUpdate(
            { member_id: id },
            { ...req.body }
          );
        } else {
          console.log("else case 3");
          const updateMember = await Member.findOneAndUpdate(
            { member_id: id },
            { ...req.body }
          );
        }
      } else {
        console.log("else case 2");
        if (req.body.new_family === "true") {
          console.log("new_family true");
          const familyMembers = await Family.find({
            head: id,
          });
          if (familyMembers.length === 0) {
            console.log("length 0");
            const family_id = await generateFamilyCode();
            const newFamily = new Family({
              family_id: family_id,
              head: id,
              members: [],
            });
            const savedFamily = await newFamily.save();
            req.body.left_date = null;
            req.body.reason_for_inactive = null;
            req.body.description = null;
            req.body.secondary_family_id = family_id;
          }
        }
      }
    }
    const updateMember = await Member.findOneAndUpdate(
      { member_id: id },
      { ...req.body }
    );

    return res.status(200).json({ message: "Updated Successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to Update member", error: error.message });
  }
};
