import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for Loan data
interface ILoan extends Document {
  idNumber: number;
  fullName: string;
  loanAmount: number;
  loanTenure: number;
  employmentStatus: string;  
  reasonForLoan: string;
  employmentAddress: string;
  status: string;
  loanOfficer?: string;  
}

// Create the Loan schema
const LoanSchema: Schema = new Schema({
  idNumber: {
    type: Number,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  loanAmount: {
    type: Number,
    required: true,
  },
  loanTenure: {
    type: Number,
    required: true,
  },
  employmentStatus: {  
    type: String,
    required: true,
  },
  reasonForLoan: {
    type: String,
    required: true,
  },
  employmentAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  loanOfficer: {
    type: String,
    required: true,  
  }
}, { timestamps: true });  

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
