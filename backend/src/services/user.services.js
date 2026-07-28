import User from "../models/user.models.js";
import {BadRequestError, ConflictError, NotFoundError, UnauthorizedError} from "../errors/AppError.js";
export const createUserService = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    console.log("Invalid details, User creation failed");
    throw new BadRequestError("Email and password are required for user creation.");
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    const hashedPassword = await User.hashPassword(password);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return user;
  } else {
     console.log("User already exists !!");
     throw new ConflictError("User already exists.")
  }
};

export const loginUserService = async ({email, password}) =>{
  if(!email || !password){
    console.log("Invalid credentials.")
    throw new BadRequestError("Invalid credentials.")
  }
  const user = await User.findOne({email}).select('+password')
  if(!user){
    console.log("User not found.")
    throw new UnauthorizedError("Invalid email or password.")
  }
  const isMatch = await user.isValidPassword(password)
  if(!isMatch){
    console.log("Incorrect passowrd.")
    throw new UnauthorizedError("Invalid email or password.")
  }
  return user
}

export const getUserInfoService = async ({email}) => {
  if(!email){
    throw new BadRequestError("email is required.");
  }

  const user = await User.findOne({email}).select('email username _id');
  if(!user){
    throw new NotFoundError("User not found.")
  }
  return user
}