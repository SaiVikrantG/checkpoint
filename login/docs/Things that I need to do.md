Things that I need to do:


For stateful methods, i need to store the user's information in which case i would need redis or something similar to store the user's information. ig it depends on whether I would need to provide login for everyone or not in the end.

So currently i plan on adding users myself to allow access to the admin side, and even then restricting access to most functionality on the admin side, meaning rhey will mostly only have view only access, but I want to be able to add more roles if needed.

ig i can think of three roles for now, being super-admin, admin and user

super-admin: need to think of a better name, has read and write access to the blogs on the backend, can also add articles and blogs and decide which blogs should be made poublic and which shouldnt be. can also add users as admins/any other role that does come up/super-admin. super admin should also be able to revoke users. also view uers currently.

admin: has read access to all the stuff on the admin side, means they can read all the blogs and artiles i am writing/preparing. cant toggle the visibility of those blogs though. 

users: cant access admin page at all, only the users page

for all these requirements, i need to be able to store the user's credentials such that i can check if the user still exists or their access has expired or not. so i do need a persistent storage

We going hybrid.

# Hybrid Authentication System: Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Route Documentation](#route-documentation)
6. [Security Considerations](#security-considerations)

---

## Overview

A **hybrid authentication system** combines the benefits of **stateless** (JWT) and **stateful** (database/cache) approaches:

- **Stateless**: Fast token verification using digital signatures (no database lookup needed)
- **Stateful**: Database/cache for revocation, permission updates, and security checks

This approach provides:
- ✅ High performance (95% of requests are stateless)
- ✅ Token revocation capability (logout)
- ✅ Real-time permission updates
- ✅ Security for sensitive operations
- ✅ Scalability across multiple servers

---

## Core Concepts

### JWT (JSON Web Token)
A signed token containing user information:
```
Header.Payload.Signature
```

**Payload example:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "role": "user",
  "iat": 1640000000,
  "exp": 1640900000
}
```

The signature proves the token hasn't been tampered with.

### Two-Token Strategy

| Token | Lifetime | Purpose | When Used |
|-------|----------|---------|-----------|
| **Access Token** | 15-60 minutes | API requests | Every API call |
| **Refresh Token** | 7-30 days | Get new access token | When access token expires |

### Blacklist
A list of revoked tokens (stored in Redis for speed) that prevents logout tokens from being reused.

---

## Architecture

### Component Flow

```
┌──────────────┐
│   Client     │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Login with credentials
       ↓
┌──────────────────────────────────┐
│   Authentication Server          │
│  ┌────────────────────────────┐  │
│  │ 1. Verify credentials      │  │
│  │    (Query DB)              │  │
│  │ 2. Create JWT tokens       │  │
│  │ 3. Send back tokens        │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
       │
       │ 2. Returns access + refresh tokens
       ↓
┌──────────────┐
│   Client     │
│  Stores:     │
│  - Access    │
│  - Refresh   │
└──────┬───────┘
       │
       │ 3. API requests with access token
       ↓
┌──────────────────────────────────┐
│   API Server                     │
│  ┌────────────────────────────┐  │
│  │ 1. Verify token signature  │  │
│  │    (Stateless)             │  │
│  │ 2. Extract user info       │  │
│  │ 3. Process request         │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

(For sensitive ops: Also check DB/cache)
```

### Storage Requirements

**Database (PostgreSQL/MongoDB):**
- Users table (email, password hash, role, status)
- Session logs (for audit trail)

**Cache (Redis):**
- Token blacklist (for revocation)
- Rate limiting counters
- Session data (optional)

---

## Implementation Details

### Prerequisites
```bash
npm install express jsonwebtoken bcryptjs redis
```

### Environment Variables
```
JWT_SECRET=your-super-secret-key-for-access-tokens
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REDIS_URL=redis://localhost:6379
```

### Setup Code

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const redis = require('redis');
const app = express();

// Initialize Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect();

// Middleware
app.use(express.json());

// ============================================
// MIDDLEWARE: Verify JWT Signature (Stateless)
// ============================================
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // STATELESS: Just verify signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // HYBRID: For sensitive endpoints, check blacklist here
    // See hybrid middleware below
    
    req.user = decoded;
    req.token = token; // Store token for blacklist operations
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// MIDDLEWARE: Hybrid Check (Stateless + Stateful)
// ============================================
async function authenticateTokenHybrid(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // HYBRID: Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// MIDDLEWARE: Admin Check
// ============================================
async function adminOnly(req, res, next) {
  // HYBRID: Query DB for current role (permissions might have changed)
  const user = await db.findUserById(req.user.userId);
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended' });
  }
  
  next();
}

// ============================================
// UTILITY: Generate Tokens
// ============================================
function generateTokens(userId, email, role) {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken };
}

// ============================================
// UTILITY: Hash Password
// ============================================
async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcryptjs.compare(password, hash);
}

module.exports = { app, authenticateToken, authenticateTokenHybrid, adminOnly, generateTokens, hashPassword, verifyPassword };
```

---

## Route Documentation

### 1. REGISTER
**Endpoint:** `POST /auth/register`

**Purpose:** Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Response (400):**
```json
{
  "error": "Email already exists"
}
```

**Implementation:**
```javascript
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const user = await db.createUser({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      status: 'active',
      createdAt: new Date()
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

---

### 2. LOGIN
**Endpoint:** `POST /auth/login`

**Purpose:** Authenticate user and issue tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

**Implementation:**
```javascript
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // STATEFUL: Query DB to verify credentials (one-time check)
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // STATELESS: Generate JWT tokens (no DB needed)
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Optional: Log login attempt in database (audit trail)
    await db.logLoginAttempt(user.id, 'success', req.ip);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

---

### 3. LOGOUT
**Endpoint:** `POST /auth/logout`

**Purpose:** Revoke user's tokens

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Implementation:**
```javascript
app.post('/auth/logout', authenticateTokenHybrid, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.token;

    // Verify refresh token
    if (refreshToken) {
      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid refresh token' });
      }
    }

    // STATEFUL: Add tokens to blacklist
    // Calculate TTL (time to live) = token expiry - now
    const decodedAccess = jwt.decode(accessToken);
    const decodedRefresh = refreshToken ? jwt.decode(refreshToken) : null;

    const accessTtl = decodedAccess.exp - Math.floor(Date.now() / 1000);
    const refreshTtl = decodedRefresh ? decodedRefresh.exp - Math.floor(Date.now() / 1000) : 0;

    // Store in blacklist with expiry
    if (accessTtl > 0) {
      await redisClient.setEx(`blacklist:${accessToken}`, accessTtl, 'true');
    }
    
    if (refreshToken && refreshTtl > 0) {
      await redisClient.setEx(`blacklist:${refreshToken}`, refreshTtl, 'true');
    }

    // Log logout
    await db.logLogoutAttempt(req.user.userId, req.ip);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});
```

---

### 4. REFRESH TOKEN
**Endpoint:** `POST /auth/refresh`

**Purpose:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Token refreshed successfully"
}
```

**Response (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

**Implementation:**
```javascript
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    // STATELESS: Verify refresh token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // HYBRID: Query DB to verify user still exists and is active
    const user = await db.findUserById(decoded.userId);
    if (!user || user.status === 'suspended') {
      return res.status(403).json({ error: 'User not found or account suspended' });
    }

    // STATELESS: Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.status(200).json({
      accessToken,
      message: 'Token refreshed successfully'
    });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});
```

---

### 5. CHANGE PASSWORD
**Endpoint:** `POST /auth/change-password`

**Purpose:** Update user password

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Response (400):**
```json
{
  "error": "Current password is incorrect"
}
```

**Implementation:**
```javascript
app.post('/auth/change-password', authenticateTokenHybrid, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // HYBRID: Query DB to get current password hash
    const user = await db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await db.updateUserPassword(userId, hashedNewPassword);

    // HYBRID: Blacklist all existing tokens to force re-login
    // This ensures the user must login with new password
    const ttl = 86400; // 24 hours
    await redisClient.setEx(`force-relogin:${userId}`, ttl, 'true');

    // Log password change
    await db.logPasswordChange(userId, req.ip);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
});
```

---

### 6. REQUEST PASSWORD RESET
**Endpoint:** `POST /auth/forgot-password`

**Purpose:** Initiate password reset process

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset link sent to email"
}
```

**Implementation:**
```javascript
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // HYBRID: Query DB to check if user exists
    const user = await db.findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({ 
        message: 'If email exists, password reset link has been sent' 
      });
    }

    // Generate reset token (short-lived, 15 minutes)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Store reset token in Redis
    await redisClient.setEx(`reset-token:${user.id}`, 900, resetToken);

    // Send email with reset link
    await emailService.sendPasswordResetEmail(email, resetToken);

    // Log password reset request
    await db.logPasswordResetRequest(user.id);

    res.status(200).json({ 
      message: 'If email exists, password reset link has been sent' 
    });
  } catch (err) {
    res.status(500).json({ error: 'Password reset request failed' });
  }
});
```

---

### 7. RESET PASSWORD
**Endpoint:** `POST /auth/reset-password`

**Purpose:** Reset password using reset token

**Request Body:**
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Implementation:**
```javascript
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and password required' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // HYBRID: Check if token is still in Redis
    const storedToken = await redisClient.get(`reset-token:${decoded.userId}`);
    if (storedToken !== resetToken) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // HYBRID: Query DB to verify user
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.updateUserPassword(user.id, hashedPassword);

    // Delete reset token from Redis
    await redisClient.del(`reset-token:${user.id}`);

    // Log password reset
    await db.logPasswordReset(user.id);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});
```

---

### 8. GET CURRENT USER
**Endpoint:** `GET /auth/me`

**Purpose:** Get current authenticated user's information

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Implementation:**
```javascript
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    // HYBRID: Query DB for latest user info
    const user = await db.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
```

---

### 9. UPDATE PROFILE
**Endpoint:** `PUT /auth/profile`

**Purpose:** Update user profile information

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "Jane Doe",
    "phone": "+1234567890"
  }
}
```

**Implementation:**
```javascript
app.put('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.userId;

    // Validation
    if (name && name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    // HYBRID: Update in database
    const updatedUser = await db.updateUser(userId, {
      name: name || undefined,
      phone: phone || undefined
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});
```

---

### 10. ADMIN: GET ALL USERS
**Endpoint:** `GET /admin/users`

**Purpose:** Get list of all users (admin only)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "users": [
    {
      "id": 123,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

**Implementation:**
```javascript
app.get('/admin/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // HYBRID: Query DB for users
    const users = await db.getAllUsers({
      offset,
      limit,
      // Exclude password hashes
      select: ['id', 'email', 'name', 'role', 'status', 'createdAt']
    });

    const total = await db.getUserCount();

    res.status(200).json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
```

---

### 11. ADMIN: SUSPEND USER
**Endpoint:** `POST /admin/users/:userId/suspend`

**Purpose:** Suspend a user account

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Response (200):**
```json
{
  "message": "User suspended successfully",
  "user": {
    "id": 123,
    "status": "suspended"
  }
}
```

**Implementation:**
```javascript
app.post('/admin/users/:userId/suspend', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // HYBRID: Update user status in database
    const user = await db.updateUser(userId, {
      status: 'suspended'
    });

    // Log suspension
    await db.logAdminAction(req.user.userId, 'suspend_user', userId, reason);

    res.status(200).json({
      message: 'User suspended successfully',
      user: {
        id: user.id,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});
```

---

### 12. VERIFY EMAIL
**Endpoint:** `POST /auth/verify-email`

**Purpose:** Verify user's email address

**Request Body:**
```json
{
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Implementation:**
```javascript
app.post('/auth/verify-email', async (req, res) => {
  try {
    const { verificationToken } = req.body;

    if (!verificationToken) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (decoded.type !== 'email-verify') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // HYBRID: Update user in database
    const user = await db.updateUser(decoded.userId, {
      emailVerified: true,
      emailVerifiedAt: new Date()
    });

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Email verification failed' });
  }
});
```

---

## Security Considerations

### 1. Password Storage
- ✅ Always hash passwords using bcryptjs (minimum 10 salt rounds)
- ❌ Never store plain text passwords
- ❌ Never send passwords in logs

### 2. Token Security
- ✅ Keep JWT_SECRET and JWT_REFRESH_SECRET secure (use environment variables)
- ✅ Use HTTPS only (never send tokens over HTTP)
- ✅ Store tokens in httpOnly cookies or secure storage (not localStorage)
- ❌ Never include sensitive data in token payload (it's Base64 encoded, not encrypted)

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, try again later'
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  // ... login code
});
```

### 4. CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

### 5. Token Expiry
- Access Token: 15-60 minutes (short-lived)
- Refresh Token: 7-30 days (longer-lived)
- Reset Token: 15 minutes (very short)
- Email Verification: 24 hours

### 6. Blacklist Cleanup
```javascript
// Periodically clean expired tokens from blacklist
// Redis automatically handles this with TTL
// But you can manually clean if not using Redis

setInterval(async () => {
  const now = Math.floor(Date.now() / 1000);
  // Remove tokens with exp < now
}, 3600000); // Every hour
```

### 7. Sensitive Operations Require Fresh Token
```javascript
async function requireFreshToken(req, res, next) {
  const tokenAge = Math.floor(Date.now() / 1000) - req.user.iat;
  const maxAge = 5 * 60; // 5 minutes

  if (tokenAge > maxAge) {
    return res.status(401).json({ 
      error: 'Token too old for this operation, please login again',
      code: 'FRESH_TOKEN_REQUIRED'
    });
  }
  
  next();
}

// Use for sensitive ops like password change
app.post('/auth/change-password', authenticateToken, requireFreshToken, async (req, res) => {
  // ...
});
```

### 8. Audit Logging
- Log all authentication attempts (success/failure)
- Log all password changes
- Log admin actions
- Log token refreshes for suspicious activity detection

---

## Flow Diagrams

### Login Flow
```
User enters credentials
         ↓
 [POST /login]
         ↓
Verify email + password (DB query)
         ↓
Invalid? → Return 401
         ↓
Generate JWT access token
Generate JWT refresh token
         ↓
Return tokens to client
         ↓
Client stores tokens
```

### API Request Flow
```
Client makes API call
     ↓
Include Access Token in Authorization header
     ↓
[API Endpoint with authenticateToken middleware]
     ↓
Extract token from header
     ↓
Verify signature (STATELESS)
     ↓
Signature invalid? → Return 401
     ↓
For sensitive ops: Check blacklist (STATEFUL)
     ↓
Token blacklisted? → Return 401
     ↓
✅ Grant access, process request
```

### Token Refresh Flow
```
Access token expires
     ↓
Client detects expiry
     ↓
[POST /refresh with refresh token]
     ↓
Verify refresh token signature
     ↓
Check blacklist (revoked?)
     ↓
Query DB: User still active?
     ↓
Generate new access token
     ↓
Return new access token
     ↓
Client updates stored token
```

### Logout Flow
```
User clicks logout
     ↓
[POST /logout with access token]
     ↓
Verify token
     ↓
Add token to blacklist in Redis (with TTL)
     ↓
Return success
     ↓
Client clears stored tokens
     ↓
Attacker tries old token
     ↓
Token signature valid, but blacklist check fails
     ↓
❌ Access denied
```

---

## Summary

| Operation | Stateless | Stateful | Why |
|-----------|-----------|----------|-----|
| Verify token | ✅ | | Fast signature check |
| Logout | | ✅ | Need to revoke immediately |
| Login | | ✅ | Verify credentials against DB |
| Change password | | ✅ | Update in DB |
| Permission check | | ✅ | Current permissions might differ |
| API requests | ✅ | | Speed (95% of requests) |
| Generate tokens | ✅ | | No DB needed |
| Refresh token | ✅ | ✅ | Verify signature + user status |

This hybrid approach provides the best of both worlds: **fast stateless verification for most requests** with **stateful security checks when needed**.