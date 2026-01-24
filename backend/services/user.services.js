import User from "../models/user.models.js";

export const createUserService = async ({ email, password }) => {
  if (!email || !password) {
    console.log("Invalid details, User creation failed");
    throw new Error("Email and password are required for user creation.");
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    const hashedPassword = await User.hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
    });
    return user;
  } else {
     console.log("User already exists !!");
     throw new Error("User already exists.")
  }
};
