import authService from '../services/authService.js';

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.registerUser(req.body);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error('Registration error:', error);

      if (error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.loginUser(req.body);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error.message.includes('Invalid')) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message,
      });
    }
  }

  async logout(req, res) {
    try {
      res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out',
        error: error.message,
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await authService.getUserById(req.userId);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Get current user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message,
      });
    }
  }
}

const authController = new AuthController();
export default authController;
