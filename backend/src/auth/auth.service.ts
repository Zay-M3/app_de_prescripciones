import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const tokens = await this.generateTokens(payload);
        await this.updateRtHash(user.id, tokens.refreshToken);
        return tokens;
    }

    async refresh(userId: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.hashedRt) {
            throw new ForbiddenException('Access denied');
        }

        const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt);

        if (!rtMatches) {
            throw new ForbiddenException('Access denied');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const tokens = await this.generateTokens(payload);
        await this.updateRtHash(user.id, tokens.refreshToken);
        return tokens;
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: null },
        });
    }

    private async generateTokens(payload: { sub: string; email: string; role: string }) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: process.env.JWT_REFRESH_TTL as StringValue,
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRtHash(userId: string, rt: string) {
        const hash = await bcrypt.hash(rt, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: hash },
        });
    }
}
