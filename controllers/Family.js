const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const generateMemberCode = require("../util/MemberCodeGenerate");
const generateFamilyCode = require("../util/FamilyId");

// Get All Family list
exports.getMembers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;

  try {
    // Fetch registered family data with pagination
    const FamilyData = await Family.find()
      .sort({ createdAt: -1 })
      .select("family_id head")
      .skip((page - 1) * limit)
      .limit(limit);

    // Array to accumulate all combined family and member data
    let RegisteredData = [];

    // Loop through each registered family and fetch corresponding members
    for (const family of FamilyData) {
      const familyMembers = await Member.findOne({
        member_id: family.head
      }).select("member_id member_name status primary_family_id");
      
      // Combine the family and member information
      if (familyMembers) {
        RegisteredData.push({
          _id: familyMembers._id,
          family_id: family.family_id,
          head: family.head,
          member_name: familyMembers.member_name,
          status: familyMembers.status
        });
      }
    }
    // Log the accumulated members
    // console.log('Members:', RegisteredData);
    // console.log(RegisteredData);

    const totalItems = await Family.countDocuments();
    const TotalPages = Math.ceil(totalItems / limit);

    return res.json({
      message: "Get Family Data Successful",
      RegisteredData,
      totalItems,
      TotalPages,
      currentPage: page
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch members", error: error.message });
  }
};

// get treeMembers family list
exports.treeMembers = async (req, res) => {
  const { id } = req.params;
  try {
    const FamilyDetails = await Family.find({ family_id: req.params.id });
    if (!FamilyDetails) {
      return res.status(404).json({ message: "Member not found" });
    }
    return res.status(200).json(FamilyDetails[0]);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch member", error: error.message });
  }
};

// const familyTreeMembers = async (req, res) => {
//   const id = "VKDFAM00001";

//   try {
//     let family;
//     const FamilyDetails = await Family.findOne({ family_id: id }).lean();
// console.log(FamilyDetails);
    
    
//   } catch (error) {
//   //  return error.message
//   console.log(error.message); 

//     // return res
//     //   .status(500)
//     //   .json({ message: "Failed to fetch member", error: error.message });
//   }
// };
// familyTreeMembers();
// console.log(familyTreeMembers());
// get single family list
exports.SingleGetMemberById = async (req, res) => {
  const { id } = req.params;

  try {
    // Array to accumulate all combined family and member data
    const FamilyData = await Family.find({ family_id: id }).select(
      "family_id head"
    );
    let RegisteredData = [];

    // Loop through each registered family and fetch corresponding members
    for (const family of FamilyData) {
      const familyMembers = await Member.findOne({
        member_id: family.head
      }).select("member_id member_name permanent_address");

      // Combine the family and member information
      if (familyMembers) {
        RegisteredData.push({
          family_id: family.family_id,
          family_head_name: familyMembers.member_name,
          permanent_address: familyMembers.permanent_address
        });
      }
    }
    return res
      .status(200)
      .json({ message: "Data", FamilyData: RegisteredData[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch member", error: error.message });
  }
};
