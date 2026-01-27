import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    username:{
        type:String,
        required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password:{
        type:String,
        required:true,
        select: false
    }
  },
  { timestamps: true },
);

userSchema.statics.hashPassword = async function (password){
    return await bcrypt.hash(password,10);
}

userSchema.methods.isValidPassword = async function (password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateJWT = function (){
    return jwt.sign(
        {
            userId: this._id, 
            email: this.email 
        }, 
        process.env.JWT_SECRET,
        {expiresIn: '12h'}
    )
}

const User = mongoose.model("User",userSchema);

export default User