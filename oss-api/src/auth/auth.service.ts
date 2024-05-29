import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {
    this.Uname = process.env.USERNAME;
    this.password = process.env.PASSWORD;
  }
  private Uname: string;
  private password: string;

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    if (this.password !== pass || this.Uname !== username) {
      throw new UnauthorizedException();
    }
    const payload = { sub: 1, username: this.Uname };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
