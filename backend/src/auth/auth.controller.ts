import { Body, Controller, HttpStatus, Post, Req, Get, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard, RtAuthGuard } from 'src/common/guards';

@Controller('auth')
@ApiTags('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @UseGuards(RtAuthGuard)
    @Post('refresh')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    refresh(@Req() req: any) {
        return this.authService.refresh(req.user.sub, req.user.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    logout(@Req() req: any) {
        return this.authService.logout(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    getProfile(@Req() req: any) {
        return req.user;
    }
}
