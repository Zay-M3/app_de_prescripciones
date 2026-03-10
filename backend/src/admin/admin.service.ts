import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);

    const [doctors, patients, prescriptions, byStatus, byDay, topDoctors] =
      await Promise.all([
        this.prisma.doctor.count(),
        this.prisma.patient.count(),
        this.prisma.prescription.count({ where: dateFilter }),
        this.getByStatus(dateFilter),
        this.getByDay(dateFilter),
        this.getTopDoctors(dateFilter),
      ]);

    return {
      totals: { doctors, patients, prescriptions },
      byStatus,
      byDay,
      topDoctors,
    };
  }

  async findAllPrescriptions(query: {
    status?: string;
    doctorId?: string;
    patientId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, doctorId, patientId, from, to, page = 1, limit = 10 } = query;

    const where: any = {};

    if (status) where.status = status;
    if (doctorId) where.authorId = doctorId;
    if (patientId) where.patientId = patientId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: {
          items: true,
          patient: { include: { user: { select: { name: true, email: true } } } },
          author: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildDateFilter(from?: string, to?: string): any {
    if (!from && !to) return {};

    const createdAt: any = {};
    if (from) createdAt.gte = new Date(from);
    if (to) createdAt.lte = new Date(to);

    return { createdAt };
  }

  private async getByStatus(dateFilter: any) {
    const [pending, consumed] = await Promise.all([
      this.prisma.prescription.count({
        where: { ...dateFilter, status: 'pending' },
      }),
      this.prisma.prescription.count({
        where: { ...dateFilter, status: 'consumed' },
      }),
    ]);

    return { pending, consumed };
  }

  private async getByDay(dateFilter: any) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: dateFilter,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, number>();

    for (const p of prescriptions) {
      const date = p.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) ?? 0) + 1);
    }

    return Array.from(grouped, ([date, count]) => ({ date, count }));
  }

  private async getTopDoctors(dateFilter: any) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: dateFilter,
      select: {
        authorId: true,
        author: { include: { user: { select: { name: true } } } },
      },
    });

    const grouped = new Map<string, { doctorId: string; name: string; count: number }>();

    for (const p of prescriptions) {
      const existing = grouped.get(p.authorId);
      if (existing) {
        existing.count++;
      } else {
        grouped.set(p.authorId, {
          doctorId: p.authorId,
          name: p.author.user.name,
          count: 1,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  }
}
