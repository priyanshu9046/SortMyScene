import User from '../models/User.js';
import jwt from 'jsonwebtoken';

class AuthService {
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  async registerUser(userData) {
    const { username, email, password } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async loginUser(credentials) {
    const { email, password } = credentials;

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export default new AuthService();
