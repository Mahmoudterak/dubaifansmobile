import { createHash, randomBytes } from 'crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        snapchatUrl: true,
        googleBusinessUrl: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      user,
      accessToken: await this.createAccessToken(user.id, user.email, user.role),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        businessName: user.businessName,
        businessType: user.businessType,
        websiteUrl: user.websiteUrl,
        instagramUrl: user.instagramUrl,
        facebookUrl: user.facebookUrl,
        tiktokUrl: user.tiktokUrl,
        snapchatUrl: user.snapchatUrl,
        googleBusinessUrl: user.googleBusinessUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: await this.createAccessToken(user.id, user.email, user.role),
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        snapchatUrl: true,
        googleBusinessUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      businessName?: string | null;
      businessType?: string | null;
      websiteUrl?: string | null;
      instagramUrl?: string | null;
      facebookUrl?: string | null;
      tiktokUrl?: string | null;
      snapchatUrl?: string | null;
      googleBusinessUrl?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim() || null;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();

      if (email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new ConflictException('Email already registered');
        }
      }

      data.email = email;
    }

    if (dto.businessName !== undefined) {
      data.businessName = dto.businessName.trim() || null;
    }

    if (dto.businessType !== undefined) {
      data.businessType = dto.businessType.trim() || null;
    }

    if (dto.websiteUrl !== undefined) {
      data.websiteUrl = dto.websiteUrl.trim() || null;
    }

    if (dto.instagramUrl !== undefined) {
      data.instagramUrl = dto.instagramUrl.trim() || null;
    }

    if (dto.facebookUrl !== undefined) {
      data.facebookUrl = dto.facebookUrl.trim() || null;
    }

    if (dto.tiktokUrl !== undefined) {
      data.tiktokUrl = dto.tiktokUrl.trim() || null;
    }

    if (dto.snapchatUrl !== undefined) {
      data.snapchatUrl = dto.snapchatUrl.trim() || null;
    }

    if (dto.googleBusinessUrl !== undefined) {
      data.googleBusinessUrl = dto.googleBusinessUrl.trim() || null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        snapchatUrl: true,
        googleBusinessUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
      },
    });

    const genericResponse = {
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط استعادة كلمة المرور.',
    };

    if (!user) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const resetUrl = `dubaifans://reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'استعادة كلمة المرور - Dubai Fans',
      text: `مرحباً،

تم طلب استعادة كلمة المرور لحسابك في Dubai Fans.

افتح الرابط التالي لتعيين كلمة مرور جديدة:
${resetUrl}

الرابط صالح لمدة 15 دقيقة فقط.

إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة.`,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <h2>استعادة كلمة المرور</h2>
          <p>مرحباً،</p>
          <p>تم طلب استعادة كلمة المرور لحسابك في <strong>Dubai Fans</strong>.</p>
          <p>اضغط على الزر التالي لتعيين كلمة مرور جديدة:</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#d71920;color:#fff;text-decoration:none;border-radius:8px">
              إعادة تعيين كلمة المرور
            </a>
          </p>
          <p>الرابط صالح لمدة <strong>15 دقيقة</strong> فقط.</p>
          <p>إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة.</p>
        </div>
      `,
    });

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    return { success: true };
  }

  async googleLogin(idToken: string) {
    const client = new OAuth2Client(
      process.env.GOOGLE_WEB_CLIENT_ID,
    );

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_WEB_CLIENT_ID,
      });
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google account');
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const name = payload.name?.trim() || null;

    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
            name,
            googleId,
          },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        businessName: user.businessName,
        businessType: user.businessType,
        websiteUrl: user.websiteUrl,
        instagramUrl: user.instagramUrl,
        facebookUrl: user.facebookUrl,
        tiktokUrl: user.tiktokUrl,
        snapchatUrl: user.snapchatUrl,
        googleBusinessUrl: user.googleBusinessUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: await this.createAccessToken(
        user.id,
        user.email,
        user.role,
      ),
    };
  }

  private async createAccessToken(
    userId: string,
    email: string,
    role: string,
  ) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });
  }
}
