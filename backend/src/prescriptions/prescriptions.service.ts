import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  private generateCode(): string {
    const year = new Date().getFullYear();
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `RX-${year}-${random}`;
  }

  private readonly includeRelations = {
    items: true,
    patient: { include: { user: { select: { name: true, email: true } } } },
    author: {
      include: { user: { select: { name: true, email: true } } },
    },
  };

  async findAll(query: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    order?: string;
    mine?: string;
    userId?: string;
  }) {
    const { status, from, to, page = 1, limit = 10, order = 'desc', mine, userId } = query;

    const where: any = {};

    if (status) where.status = status;

    // Doctor ve solo las suyas
    if (mine === 'true' && userId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (doctor) where.authorId = doctor.id;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: this.includeRelations,
        orderBy: { createdAt: order === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async findMyPrescriptions(userId: string, query: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 10 } = query;

    const patient = await this.prisma.patient.findUnique({ where: { userId } });

    if (!patient) {
      throw new BadRequestException('Patient profile not found');
    }

    const where: any = { patientId: patient.id };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: this.includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(authorId: string, dto: CreatePrescriptionDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: authorId },
    });

    if (!doctor) {
      throw new BadRequestException('Only doctors can create prescriptions');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.prescription.create({
      data: {
        code: this.generateCode(),
        notes: dto.notes,
        authorId: doctor.id,
        patientId: dto.patientId,
        items: {
          create: dto.items,
        },
      },
      include: this.includeRelations,
    });
  }

  async consume(id: string, userId: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.patient.userId !== userId) {
      throw new BadRequestException('This prescription does not belong to you');
    }

    if (prescription.status === 'consumed') {
      throw new BadRequestException('Prescription already consumed');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: 'consumed',
        consumedAt: new Date(),
      },
      include: this.includeRelations,
    });
  }

  async delete(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    await this.prisma.prescriptionItem.deleteMany({
      where: { prescriptionId: id },
    });

    return this.prisma.prescription.delete({
      where: { id },
    });
  }
}
