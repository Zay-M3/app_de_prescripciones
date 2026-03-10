import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';

// Mock PrismaService to avoid loading the generated Prisma client
jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { PrismaService } from 'src/prisma/prisma.service';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: PrismaService,
          useValue: {
            doctor: { findUnique: jest.fn() },
            patient: { findUnique: jest.fn() },
            prescription: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a prescription successfully', async () => {
      const dto = {
        patientId: 'patient-1',
        notes: 'Take with food',
        items: [{ name: 'Amoxicilina 500mg', dosage: '1 c/8h', quantity: 15 }],
      };
      const mockDoctor = { id: 'doctor-1', userId: 'user-doc-1' };
      const mockPatient = { id: 'patient-1', userId: 'user-pat-1' };
      const mockCreated = { id: 'presc-1', code: 'RX-2026-ABC123', ...dto };

      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.prescription.create.mockResolvedValue(mockCreated);

      const result = await service.create('user-doc-1', dto);

      expect(result).toEqual(mockCreated);
      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-doc-1' },
      });
      expect(prisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
      });
    });
  });

  describe('consume', () => {
    const mockPrescription = {
      id: 'presc-1',
      status: 'pending',
      patient: { userId: 'user-pat-1' },
    };

    it('should mark a prescription as consumed', async () => {
      prisma.prescription.findUnique.mockResolvedValue(mockPrescription);
      prisma.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: 'consumed',
      });

      const result = await service.consume('presc-1', 'user-pat-1');

      expect(result.status).toBe('consumed');
      expect(prisma.prescription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'presc-1' },
          data: expect.objectContaining({ status: 'consumed' }),
        }),
      );
    });

    it('should throw BadRequestException if prescription does not belong to patient', async () => {
      prisma.prescription.findUnique.mockResolvedValue(mockPrescription);

      await expect(
        service.consume('presc-1', 'another-user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if prescription does not exist', async () => {
      prisma.prescription.findUnique.mockResolvedValue(null);

      await expect(
        service.consume('nonexistent', 'user-pat-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
