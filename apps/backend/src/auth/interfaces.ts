// JWT payload
export interface IJwtPayload {
  sub: string; // User.id
  email: string; // User.googleEmail
  exp: number; // milliseconds since UNIX epoch
}
