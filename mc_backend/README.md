# Mobile Care Backend

Production-ready backend for Mobile Care e-commerce website.

## Tech Stack

- Node.js + Express.js
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcrypt for password hashing
- Nodemailer for email OTP
- Twilio for SMS OTP
- Cloudinary for image storage

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong secret key for JWT
- `EMAIL_*`: Email service configuration
- `TWILIO_*`: Twilio SMS service
- `CLOUDINARY_*`: Cloudinary image storage

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Create Admin User

Run this SQL in your database to create an admin user:

```sql
INSERT INTO users (id, "fullName", email, phone, password, role, "emailVerified", "phoneVerified")
VALUES (
  'admin-user-id',
  'Admin User',
  'admin@mobilecare.com',
  '+1234567890',
  '$2b$10$hash-your-password-here',
  'ADMIN',
  true,
  true
);
```

### 5. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Start signup process
- `POST /api/auth/verify-signup` - Complete signup with OTP
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/phone-login` - Send phone OTP
- `POST /api/auth/verify-phone-login` - Verify phone OTP

### Products (Public)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories/list` - Get categories

### Orders (Authenticated)
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get single order

### Admin (Admin Only)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/products` - Get all products (admin)
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/dashboard/stats` - Dashboard statistics

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- OTP verification for signup and phone login
- Rate limiting on OTP endpoints
- Admin-only route protection
- Input validation with Joi
- CORS and Helmet security headers

## Database Schema

### Users
- Authentication and user management
- Role-based access (USER/ADMIN)
- Email and phone verification flags

### OTP
- Secure OTP storage with hashing
- Expiration and attempt limits
- Auto-cleanup after verification

### Products
- Product catalog with images
- Stock management
- Category organization

### Orders
- Order management with status tracking
- Order items with pricing snapshot
- Cash on delivery only

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure proper CORS origins
4. Set up SSL/TLS
5. Use connection pooling for database
6. Set up monitoring and logging
7. Configure rate limiting appropriately

## Error Handling

All endpoints include proper error handling with:
- Input validation
- Database error handling
- Authentication/authorization checks
- Meaningful error messages
- Proper HTTP status codes