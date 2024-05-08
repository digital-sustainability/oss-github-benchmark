import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>) {
    console.log(signInDto);
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
