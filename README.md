# Coast Peak Studio Backend API

A production-ready Django REST Framework backend with PostgreSQL database integration and JWT authentication.

## Tech Stack

- **Django 5.0.2** - Web framework
- **Django REST Framework 3.14.0** - API framework
- **PostgreSQL** - Database
- **JWT Authentication** - Token-based authentication
- **drf-spectacular** - OpenAPI/Swagger documentation
- **django-cors-headers** - CORS support for frontend integration

## Features

- Custom User model with email-based authentication
- JWT token authentication (access & refresh tokens)
- User registration with email validation
- User login with role-based access (admin/user)
- Protected profile endpoint
- Token refresh functionality
- Logout with token blacklisting
- Swagger/OpenAPI documentation
- PostgreSQL database integration
- Environment variable configuration
- CORS enabled for frontend integration

## Project Structure

```
backend/
├── config/                 # Django project configuration
│   ├── __init__.py
│   ├── settings.py        # Main settings with PostgreSQL, JWT, CORS
│   ├── urls.py            # Main URL routing
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
├── authentication/        # Authentication app
│   ├── __init__.py
│   ├── models.py          # Custom User model
│   ├── serializers.py     # API serializers
│   ├── views.py           # API views
│   ├── urls.py            # App URL routing
│   ├── admin.py           # Admin configuration
│   └── apps.py            # App configuration
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── .gitignore            # Git ignore rules
```

## Installation

### Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)

### Setup Steps

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**

   On Windows:
   ```bash
   venv\Scripts\activate
   ```

   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables**

   Copy the `.env.example` file to `.env`:
   ```bash
   copy .env.example .env
   ```

   Edit `.env` and update the following variables:
   ```env
   SECRET_KEY=your-secret-key-here-change-in-production
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_PORT=5432
   
   JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
   JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
   
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

6. **Create PostgreSQL database**

   Connect to PostgreSQL and create a database:
   ```sql
   CREATE DATABASE your_database_name;
   CREATE USER your_database_user WITH PASSWORD 'your_database_password';
   GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_database_user;
   ```

7. **Run database migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

8. **Create a superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

9. **Run the development server**
   ```bash
   python manage.py runserver
   ```

   The server will start at `http://127.0.0.1:8000/`

## API Endpoints

### Base URL
```
http://127.0.0.1:8000/api/auth/
```

### Authentication Endpoints

#### 1. User Signup
Register a new user account.

**Endpoint:** `POST /api/auth/signup/`

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "phone_number": "+919999999999",
  "country": "India"
}
```

**Response (201 Created):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+919999999999",
    "country": "India",
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "phone_number": "+919999999999",
    "country": "India"
  }'
```

#### 2. User Login
Authenticate with email and password.

**Endpoint:** `POST /api/auth/login/`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "is_admin": true
  }
}
```

**cURL Example:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### 3. User Logout
Logout by blacklisting the refresh token.

**Endpoint:** `POST /api/auth/logout/`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**cURL Example:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/logout/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<refresh_token>"
  }'
```

#### 4. Refresh Token
Get a new access token using a valid refresh token.

**Endpoint:** `POST /api/auth/token/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**cURL Example:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<refresh_token>"
  }'
```

#### 5. User Profile
Get or update the authenticated user's profile.

**Endpoint:** `GET /api/auth/profile/`
**Endpoint:** `PUT /api/auth/profile/`
**Endpoint:** `PATCH /api/auth/profile/`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (GET - 200 OK):**
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+919999999999",
  "country": "India",
  "is_admin": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**cURL Example (GET):**
```bash
curl -X GET http://127.0.0.1:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>"
```

**cURL Example (PATCH):**
```bash
curl -X PATCH http://127.0.0.1:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+918888888888"
  }'
```

## API Documentation

Interactive API documentation is available via Swagger/OpenAPI:

- **Swagger UI:** `http://127.0.0.1:8000/api/schema/swagger-ui/`
- **ReDoc:** `http://127.0.0.1:8000/api/schema/redoc/`
- **OpenAPI Schema:** `http://127.0.0.1:8000/api/schema/`

## Role-Based Access Control

The API supports role-based access control through the `is_admin` field:

- **is_admin = true:** User can access Admin Dashboard
- **is_admin = false:** User can access User Dashboard

After login, the frontend can check the `is_admin` field in the response and redirect accordingly.

## Database Migrations

### Create new migrations
```bash
python manage.py makemigrations
```

### Apply migrations
```bash
python manage.py migrate
```

### View migration status
```bash
python manage.py showmigrations
```

### Rollback migrations
```bash
python manage.py migrate <app_name> <migration_name>
```

## Admin Panel

Access the Django admin panel at `http://127.0.0.1:8000/admin/`

Use the superuser credentials created during setup to log in.

## Security Best Practices

1. **Environment Variables:** Never commit `.env` file to version control
2. **Secret Key:** Use a strong, random secret key in production
3. **DEBUG Mode:** Set `DEBUG=False` in production
4. **HTTPS:** Use HTTPS in production
5. **Database:** Use strong database credentials
6. **CORS:** Restrict CORS origins to trusted domains only
7. **JWT Tokens:** Keep token lifetimes appropriate for your use case

## Production Deployment

For production deployment, consider:

1. Use a production web server (Gunicorn, uWSGI)
2. Use a reverse proxy (Nginx)
3. Set `DEBUG=False` in environment variables
4. Use a production database (AWS RDS, Heroku Postgres, etc.)
5. Configure static file serving (Whitenoise, AWS S3, etc.)
6. Set up proper logging and monitoring
7. Use environment-specific configuration
8. Implement rate limiting
9. Set up SSL/TLS certificates

## Common Issues

### PostgreSQL Connection Error
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if database exists

### Module Import Error
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Migration Error
- Drop and recreate database if needed
- Run `python manage.py makemigrations` then `python manage.py migrate`

## License

This project is proprietary and confidential.

## Support

For support and questions, contact the development team.
#   C o a s t - P e a k _ s t u d i o  
 