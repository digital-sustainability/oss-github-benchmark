import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from 'express';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    // Ensure all mocks and services are properly cleared and closed
    jest.clearAllMocks();
    await module.close();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should return true for a valid token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ userId: 1 });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: jwtConstants.secret,
      });

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual({ userId: 1 });
    });

    it('should throw UnauthorizedException for an invalid token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error());

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should return the token if the authorization header is valid', () => {
      const request = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      } as Request;

      const token = guard['extractTokenFromHeader'](request);
      expect(token).toBe('valid-token');
    });

    it('should return undefined if the authorization header is missing', () => {
      const request = {
        headers: {},
      } as Request;

      const token = guard['extractTokenFromHeader'](request);
      expect(token).toBeUndefined();
    });

    it('should return undefined if the authorization type is not Bearer', () => {
      const request = {
        headers: {
          authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        },
      } as Request;

      const token = guard['extractTokenFromHeader'](request);
      expect(token).toBeUndefined();
    });
  });
});
