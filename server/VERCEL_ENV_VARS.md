# Environment Variables for Vercel Backend Deployment

Copy and paste these into Vercel Dashboard → Project Settings → Environment Variables

## Required Environment Variables

### NODE_ENV
```
production
```

### MONGODB_URI
```
mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0
```

### JWT_SECRET
```
chatchout_super_secure_jwt_secret_2024_production_key_32_chars_minimum
```

### JWT_EXPIRE
```
7d
```

### CLIENT_URL (Update after frontend deployment)
```
https://your-frontend-domain.vercel.app
```

### STREAM_API_KEY
```
twe26yayd39n
```

### STREAM_API_SECRET
```
your_stream_secret_from_dashboard
```

## How to Add in Vercel

1. Go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. For each variable above:
   - Enter the Key (e.g., NODE_ENV)
   - Enter the Value (e.g., production)
   - Select "Production" environment
   - Click "Save"

## Important Notes

- Add each variable individually
- Make sure to select "Production" environment
- Variables are case-sensitive
- Redeploy after adding all variables
- Update CLIENT_URL after frontend deployment

## Testing

After deployment, test your backend:
https://your-backend-url.vercel.app/api/health

Should return:
```json
{
  "status": "OK",
  "message": "ChatChout server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
