import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    user: { findUnique: jest.fn(), update: jest.fn() },
  })),
}));

import { PrismaService } from 'src/prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'dr@test.com',
      password: '$2b$10$hashedpassword',
      role: 'doctor',
    };

    it('should return tokens and store hashed RT with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-rt');
      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login('dr@test.com', 'dr123');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'dr@test.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { hashedRt: 'hashed-rt' },
      });
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('noexiste@test.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('dr@test.com', 'wrongpass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    const mockUser = {
      id: 'user-1',
      email: 'dr@test.com',
      role: 'doctor',
      hashedRt: '$2b$10$somehashedrt',
    };

    it('should return new tokens when RT matches hash', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-rt');
      jwt.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refresh('user-1', 'valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', mockUser.hashedRt);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { hashedRt: 'new-hashed-rt' },
      });
    });

    it('should throw ForbiddenException when RT does not match hash (revoked)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('user-1', 'old-refresh-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user has no hashedRt (logged out)', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, hashedRt: null });

      await expect(service.refresh('user-1', 'any-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('nonexistent', 'any-token')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('logout', () => {
    it('should set hashedRt to null', async () => {
      prisma.user.update.mockResolvedValue({});

      await service.logout('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { hashedRt: null },
      });
    });
  });
});
