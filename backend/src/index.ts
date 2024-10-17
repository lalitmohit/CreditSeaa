import express, { Request, Response, NextFunction } from "express";
import { connectDB } from "./database";
import { Loan } from "./models/Loan";
import cors from "cors";

const app = express();
const PORT = 8000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://credit-sea-b2qi.vercel.app",
];

// CORS options
const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true,
};

// Use CORS middleware
app.use(cors(corsOptions));

// Reusable error handler
const errorHandler = (
  res: Response,
  statusCode: number,
  message: string,
  details?: string
) => {
  res.status(statusCode).json({ error: message, details });
};

// Async wrapper for route handlers to catch async errors
const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// API to create a new loan entry
app.post(
  "/loans",
  asyncWrapper(async (req: Request, res: Response) => {
    const {
      fullName,
      loanAmount,
      loanTenure,
      employmentStatus,
      reasonForLoan,
      employmentAddress,
    } = req.body;
    const idNumber = req.query.idNumber;
    const status = "PENDING";
    const loanOfficer = "Not Assigned";

    if (!idNumber) {
      return errorHandler(res, 400, "IdNumber is required.");
    }

    try {
      const newLoan = new Loan({
        idNumber,
        fullName,
        loanAmount,
        loanTenure,
        employmentStatus,
        reasonForLoan,
        employmentAddress,
        status,
        loanOfficer,
      });
      await newLoan.save();
      res.status(201).json(newLoan);
    } catch (error) {
      errorHandler(
        res,
        500,
        "Error creating loan entry",
        (error as Error).message
      );
    }
  })
);

// API to get loan entries based on user role (verifier or admin)
app.get(
  "/loans",
  asyncWrapper(async (req: Request, res: Response) => {
    const { role } = req.query; 

    try {
      let loans;
      if (role === "verifier") {
        loans = await Loan.find({ status: { $in: ["PENDING", "VERIFIED"] } });
      } else if (role === "admin") {
        loans = await Loan.find({
          status: { $in: ["VERIFIED", "APPROVED", "REJECTED"] },
        });
      } else {
        return errorHandler(
          res,
          400,
          'Invalid role. Please specify either "verifier" or "admin".'
        );
      }
      res.status(200).json(loans);
    } catch (error) {
      errorHandler(
        res,
        500,
        "Error fetching loan entries",
        (error as Error).message
      );
    }
  })
);

// API to get loan entries by idNumber
app.get(
  "/loans/id",
  asyncWrapper(async (req: Request, res: Response) => {
    const { idNumber } = req.query;

    if (!idNumber || isNaN(Number(idNumber))) {
      return errorHandler(
        res,
        400,
        "Invalid idNumber provided. It should be a number."
      );
    }

    try {
      const loans = await Loan.find({ idNumber: Number(idNumber) }); 

      if (loans.length === 0) {
        return errorHandler(res, 404, "No loans found for this idNumber.");
      }

      res.status(200).json(loans);
    } catch (error) {
      errorHandler(
        res,
        500,
        "Error fetching loans by idNumber",
        (error as Error).message
      );
    }
  })
);

// API to update the loan status using the loan's Object ID
app.patch(
  "/loans/status-verifier",
  asyncWrapper(async (req: Request, res: Response) => {
    const { _id } = req.query;
    const { status, loanOfficer } = req.body;

    if (!status) {
      return errorHandler(res, 400, "Status is required to update the loan.");
    }
    if (!loanOfficer) {
      return errorHandler(
        res,
        400,
        "loanOfficer is required to update the loan."
      );
    }

    try {
      const updatedLoan = await Loan.findByIdAndUpdate(
        _id,
        { status, loanOfficer },
        { new: true, runValidators: true }
      );

      if (!updatedLoan) {
        return errorHandler(res, 404, "Loan not found.");
      }

      res.status(200).json(updatedLoan);
    } catch (error) {
      errorHandler(
        res,
        500,
        "Error updating loan status",
        (error as Error).message
      );
    }
  })
);

// API to update the loan status by Admin using the loan's Object ID
app.patch(
  "/loans/status-admin",
  asyncWrapper(async (req: Request, res: Response) => {
    const { _id } = req.query;
    const { status } = req.body;

    if (!status) {
      return errorHandler(res, 400, "Status is required to update the loan.");
    }

    try {
      const updatedLoan = await Loan.findByIdAndUpdate(
        _id,
        { status },
        { new: true, runValidators: true }
      );

      if (!updatedLoan) {
        return errorHandler(res, 404, "Loan not found.");
      }

      res.status(200).json(updatedLoan);
    } catch (error) {
      errorHandler(
        res,
        500,
        "Error updating loan status",
        (error as Error).message
      );
    }
  })
);

// // API to get the total number of distinct active users (distinct by idNumber)

// app.get('/loans/active-users', asyncWrapper(async (req: Request, res: Response) => {
//   try {
//     // Aggregate query to group by idNumber and get distinct users
//     const activeUsers = await Loan.aggregate([
//       { $group: { _id: "$idNumber" } } // Group by idNumber to get distinct users
//     ]);

//     // Return the count of distinct active users
//     res.status(200).json({ activeUserCount: activeUsers.length });
//   } catch (error) {
//     // Handle any potential errors during the database query
//     errorHandler(res, 500, 'Error fetching active users', (error as Error).message);
//   }
// }));


// // API to get the number of active users

// app.get('/loans/borrow-users', asyncWrapper(async (req: Request, res: Response) => {
//   try {
//     const activeUsers = await Loan.aggregate([
//       { $match: { status: { $ne: 'PENDING' } } }, // Filter out loans with "PENDING" status
//       { $group: { _id: "$idNumber" } } // Group by idNumber to find distinct users
//     ]);
//     // Return the count of active users
//     res.status(200).json({ activeUserCount: activeUsers.length });
//   } catch (error) {
//     console.error('Error fetching active users:', (error as Error).message);
//     res.status(500).json({
//       error: 'Error fetching active users',
//       details: (error as Error).message,
//     });
//   }
// }));

// // API to get the total number of loans with status "APPROVED"
// app.get('/loans/loans-count', asyncWrapper(async (req: Request, res: Response) => {
//   try {
//
//     const approvedLoanCount = await Loan.countDocuments({ status: 'APPROVED' });
//
//     res.status(200).json({ approvedLoanCount });
//   } catch (error) {
//
//     errorHandler(res, 500, 'Error fetching approved loans count', (error as Error).message);
//   }
// }));

// // API to get the total disbursed loanAmount (sum of loanAmounts where status = "APPROVED")
// app.get('/loans/total-disbursed-loanAmount', asyncWrapper(async (req: Request, res: Response) => {
//   try {
//
//     const result = await Loan.aggregate([
//       { $match: { status: 'APPROVED' } },  // Filter loans with status "APPROVED"
//       { $group: { _id: null, totalDisbursedloanAmount: { $sum: "$loanAmount" } } }  // Sum the loan loanAmounts
//     ]);

//
//     const totalDisbursedloanAmount = result.length > 0 ? result[0].totalDisbursedloanAmount : 0;
//     res.status(200).json({ totalDisbursedloanAmount });
//   } catch (error) {
//     // Handle any potential errors during the database query
//     errorHandler(res, 500, 'Error calculating total disbursed loanAmount', (error as Error).message);
//   }
// }));

// Combined API to get active users, total approved loans, and total disbursed loanAmount
app.get(
  "/loans/summary",
  asyncWrapper(async (req: Request, res: Response) => {
    try {
      const [
        distinctActiveUsers,
        distinctBorrowUsers,
        approvedLoanCount,
        totalDisbursed,
      ] = await Promise.all([
        // 1. Get the number of distinct active users by idNumber
        Loan.aggregate([{ $group: { _id: "$idNumber" } }]),

        // 2. Get the number of distinct borrow users (not "PENDING")
        Loan.aggregate([
          { $match: { status: { $ne: "PENDING" } } },
          { $group: { _id: "$idNumber" } },
        ]),

        // 3. Get the total number of loans with status "APPROVED"
        Loan.countDocuments({ status: "APPROVED" }),

        // 4. Get the total disbursed loan amount (sum of all approved loans)
        Loan.aggregate([
          { $match: { status: "APPROVED" } },
          {
            $group: {
              _id: null,
              totalDisbursedloanAmount: { $sum: "$loanAmount" },
            },
          },
        ]),
      ]);

      const totalDisbursedloanAmount =
        totalDisbursed.length > 0
          ? totalDisbursed[0].totalDisbursedloanAmount
          : 0;
      res.status(200).json([
        {
          activeUserCount: distinctActiveUsers.length,
          borrowUserCount: distinctBorrowUsers.length,
          approvedLoanCount,
          totalDisbursedloanAmount,
        },
      ]);
    } catch (error) {
      errorHandler(
        res,
        500,
        "Error fetching loan summary",
        (error as Error).message
      );
    }
  })
);

// Error-handling middleware (for unhandled errors)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  errorHandler(res, 500, "Internal Server Error", err.message);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
