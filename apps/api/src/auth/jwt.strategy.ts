import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

function jwtSecret() {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is required.");
  return process.env.JWT_ACCESS_SECRET;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret()
    });
  }

  validate(payload: { sub: string; email?: string; roles: string[]; instructorId?: string }) {
    return { id: payload.sub, email: payload.email, roles: payload.roles, instructorId: payload.instructorId };
  }
}
