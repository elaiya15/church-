const Offerings = require('../Schema/offerSchema');
const Member = require("../Schema/memberSchema");

// Controller functions
const addOffering = async (req, res) => {
  try {
    const { category, member_id, member_name, date, amount, description } = req.body;
    // Fetch member data separately
    const memberData = await Member.findOne({ member_id }).select('member_photo').lean();
    if (!memberData) {
     return res.status(404).json({ message: 'Member not found'});
    }
    const newOffering = new Offerings({ category, member_id, member_name, date, amount, description });
    await newOffering.save();
    // Construct the response object
    const offeringWithPhoto = {
      ...newOffering.toObject(), // Convert Mongoose document to plain object
      member_photo: memberData.member_photo
    };

    // Respond with the modified object
    res.status(201).json({ message: 'Offering added successfully', offering: offeringWithPhoto });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const getDistinctCategories = async (req, res) => {
  try {
    const categories = await Offerings.distinct('category');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const getAll = async (req, res) => {
  
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 15;
//   try {
//     const offerings = await Offerings.find()
//       .select("-image")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const total_offerings = await Offerings.countDocuments();
//     const totalPages = Math.ceil(total_offerings / limit);

//     res.status(200).json({
//       offerings,
//       pagination: {
//         totalPages,
//         currentPage: Number(page),
//         totalItems: total_offerings,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// getOfferingsByDateRange

const getMonthlyTotals = async (req, res) => {
  const { year } = req.query;
// console.log(req.query.year);
  if (!year) {
    return res.status(400).json({ message: 'Year is required' });
  }

  try {
    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(Number(year) + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ];
    
    const expenses = await Offerings.aggregate(pipeline);

    // Create an array to hold the monthly totals
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({ month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }), amount: 0 }));

    // Update the monthlyTotals array with aggregated data
    expenses.forEach(expense => {
      const monthIndex = expense._id - 1; // MongoDB months are 1-based
      monthlyTotals[monthIndex].amount = expense.totalAmount;
    });

    res.status(200).json({chartData:monthlyTotals});
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};


// Controller function to verify a member
const verifyMember = async (req, res) => {
  try {
    const {id} = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Member ID is required' });
    }

    const member = await Member.findOne({member_id:id}).select("member_id member_photo member_name").lean();

    if (!member) {
      return res.status(404).json({ message: 'Member not found or details do not match' });
    }

    res.status(200).json({ message: 'Member verified successfully', member });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify member', error: error.message });
  }
};

// const Offerings = require('../models/Offerings'); // Adjust the path as necessary

// const Offerings = require('../models/Offerings'); // Adjust the path as necessary

const getOfferingsByCategoryAndDate = async (req, res) => {
  try {
    const { category, fromdate, todate, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (category) query.category = category;
    if (fromdate) query.date = { ...query.date, $gte: new Date(fromdate) };
    if (todate) query.date = { ...query.date, $lte: new Date(todate) };
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { member_id: { $regex: search, $options: 'i' } },
        { member_name: { $regex: search, $options: 'i' } },
        { amount: parseInt(search) },
        { date: new Date(search) }
      ];
    }

    const skip = (page - 1) * limit;

    const offerings = await Offerings.find(query)
    .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Offerings.countDocuments(query);

    const totalAmountResult = await Offerings.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    res.status(200).json({
      offerings,
      total,
      totalAmount,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





module.exports = {
  addOffering,
  getMonthlyTotals,
  getDistinctCategories,
  // getOfferingsByCategory,
  // getOfferingsByDateRange,
  // getAll,
  verifyMember,
  getOfferingsByCategoryAndDate,

};