# Cashier Login Credentials

## Default Cashier Account

**Username:** `cashier1`  
**Password:** `cafe123`

**Name:** John Doe  
**Role:** Cashier

## How to Login

1. Navigate to: `http://192.168.0.106:3000/cashier/login`
2. Enter the credentials above
3. Click "Sign In"
4. You'll be redirected to the cashier dashboard

## Adding More Cashiers

To add more cashier accounts, edit `backend/config/cashiers.js`:

```javascript
const cashier2 = new Cashier({
  id: generateId(),
  userId: 'cashier2',
  name: 'Jane Smith',
  passwordHash: 'your_password_here',
  role: 'cashier',
  isActive: true,
  createdAt: Date.now(),
});
cashiers.set(cashier2.id, cashier2);
```

**Note:** In production, passwords should be hashed using bcrypt. Currently, passwords are stored as plain text for development purposes.

## Security Notes

- ⚠️ **Development Mode**: Passwords are stored in plain text
- ⚠️ **Production**: Use bcrypt to hash passwords
- ⚠️ **Sessions**: Currently stored in memory (will be lost on server restart)
- ⚠️ **Production**: Use Redis or JWT tokens for session management

## API Endpoints

### Login
```
POST http://192.168.0.106:4000/api/auth/login
Body: {
  "userId": "cashier1",
  "password": "cafe123"
}
```

### Verify Session
```
POST http://192.168.0.106:4000/api/auth/verify
Body: {
  "sessionId": "session-id-here"
}
```

### Logout
```
POST http://192.168.0.106:4000/api/auth/logout
Body: {
  "sessionId": "session-id-here"
}
```

## Troubleshooting

### Can't Login
- Check backend is running: `curl http://192.168.0.106:4000/api/health`
- Verify credentials are correct (case-sensitive)
- Check browser console for errors
- Verify API URL is correct in `src/lib/api.ts`

### Session Expired
- Sessions are stored in memory and will be lost on server restart
- Simply login again after server restart

### Forgot Password
- Contact administrator to reset password
- Or edit `backend/config/cashiers.js` directly

