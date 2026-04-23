// JWT payload
export interface IJwtPayload {
  sub: string; // User.id
  email: string; // User.googleEmail
  exp: number; // seconds since UNIX epoch
}

// req.user after JwtStrategy.validate()
export interface IAuthenticatedUser {
  id: string;
  googleEmail: string;
  isAdmin: boolean;
}

// Request with authenticated user
export type RequestWithAuthenticatedUser = {
  user?: IAuthenticatedUser;
};

// Request with authenticated user and optional id param
// Used for type safety in auth flow
export type RequestWithAuthenticatedUserAndIdParam = RequestWithAuthenticatedUser & {
  params: {
    id?: string;
  };
};
