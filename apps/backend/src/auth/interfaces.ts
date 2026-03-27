// JWT payload
export interface IJwtPayload {
  sub: string; // User.id
  email: string; // User.googleEmail
  exp: number; // milliseconds since UNIX epoch
}

// req.user after JwtStrategy.validate()
export interface IAuthenticatedUser {
  id: string;
  googleEmail: string;
  isAdmin: boolean;
}
