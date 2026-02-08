import User from "../models/user.models.js";

export const createUserService = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    console.log("Invalid details, User creation failed");
    throw new Error("Email and password are required for user creation.");
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
     throw new Error("User already exists.")
  }
};

export const loginUserService = async ({email, password}) =>{
  if(!email || !password){
    console.log("Invalid credentials.")
    throw new Error ("Invalid credentials.")
  }
  const user = await User.findOne({email}).select('+password')
  if(!user){
    console.log("User not found.")
    throw new Error("User with this email doesn't exists.")
  }
  const isMatch = await user.isValidPassword(password)
  if(!isMatch){
    console.log("Incorrect passowrd.")
    throw new Error("Incorrect Password.")
  }
  return user
}

export const getUserInfoService = async ({email}) => {
  if(!email){
    throw new Error ("email is required.");
  }

  const user = await User.findOne({email}).select('email username _id');
  if(!user){
    throw new Error("User not found.")
  }
  return user
}