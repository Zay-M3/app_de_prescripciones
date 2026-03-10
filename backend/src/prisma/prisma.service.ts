import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
    super({ adapter });
  }

  async onModuleInit() {
      try {
        await this.$queryRaw`SELECT 1`;
        Logger.log('Successfully connected to the database');
      } catch (error) {
        Logger.error('Failed to connect to the database', error);
    }
  }
}
