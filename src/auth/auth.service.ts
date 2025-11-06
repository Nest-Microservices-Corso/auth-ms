import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('MongoDB connected');
  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.JwtSecret,
      });
      return {
        user: user,
        token: await this.singJWT(user),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: 401,
        message: 'Invalit token',
      });
    }
  }

  singJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, name } = registerUserDto;

    try {
      const existing = await this.user.findFirst({
        where: { email },
      });

      if (existing) {
        throw new RpcException({
          status: 400,
          message: 'User already exists',
        });
      }

      const newUser = await this.user.create({
        data: {
          email: email,
          password: bcrypt.hashSync(password, 10),
          name: name,
        },
      });
      const { password: __, ...rest } = newUser;
      return {
        user: rest,
        token: this.singJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const existing = await this.user.findFirst({
        where: { email },
      });

      if (!existing) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, existing.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }
      const { password: __, ...rest } = existing;
      return {
        user: rest,
        token: this.singJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }
}
