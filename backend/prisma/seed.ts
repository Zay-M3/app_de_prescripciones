import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpiar datos existentes (orden por dependencias)
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ──
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Administrador',
      role: 'admin',
    },
  });

  // ── Doctores ──
  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'dr@test.com',
      password: await bcrypt.hash('dr123', 10),
      name: 'Dr. Carlos López',
      role: 'doctor',
      doctor: {
        create: { specialty: 'Medicina General' },
      },
    },
    include: { doctor: true },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'dr2@test.com',
      password: await bcrypt.hash('dr123', 10),
      name: 'Dra. María García',
      role: 'doctor',
      doctor: {
        create: { specialty: 'Pediatría' },
      },
    },
    include: { doctor: true },
  });

  // ── Pacientes ──
  const patientUser1 = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      password: await bcrypt.hash('patient123', 10),
      name: 'Juan Pérez',
      role: 'patient',
      patient: {
        create: { birthDate: new Date('1990-05-15') },
      },
    },
    include: { patient: true },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: 'patient2@test.com',
      password: await bcrypt.hash('patient123', 10),
      name: 'Ana Martínez',
      role: 'patient',
      patient: {
        create: { birthDate: new Date('1985-11-20') },
      },
    },
    include: { patient: true },
  });

  // ── Prescripciones (8 en total) ──
  const prescriptions = [
    {
      code: 'RX-2026-001',
      status: 'pending' as const,
      notes: 'Tomar con alimentos',
      authorId: doctorUser1.doctor!.id,
      patientId: patientUser1.patient!.id,
      items: [
        { name: 'Amoxicilina 500mg', dosage: '1 cápsula cada 8 horas', quantity: 21, instructions: 'Tomar durante 7 días' },
        { name: 'Ibuprofeno 400mg', dosage: '1 tableta cada 12 horas', quantity: 10, instructions: 'Tomar si hay dolor' },
      ],
    },
    {
      code: 'RX-2026-002',
      status: 'consumed' as const,
      notes: 'Paciente alérgico a penicilina',
      consumedAt: new Date('2026-01-15'),
      authorId: doctorUser2.doctor!.id,
      patientId: patientUser2.patient!.id,
      items: [
        { name: 'Paracetamol 500mg', dosage: '1 tableta cada 6 horas', quantity: 20, instructions: 'No exceder 4g diarios' },
      ],
    },
    {
      code: 'RX-2026-003',
      status: 'pending' as const,
      notes: 'Control en 2 semanas',
      authorId: doctorUser1.doctor!.id,
      patientId: patientUser2.patient!.id,
      items: [
        { name: 'Losartán 50mg', dosage: '1 tableta al día', quantity: 30, instructions: 'Tomar en ayunas' },
        { name: 'Metformina 850mg', dosage: '1 tableta con desayuno y cena', quantity: 60, instructions: 'No suspender sin indicación médica' },
      ],
    },
    {
      code: 'RX-2026-004',
      status: 'consumed' as const,
      notes: 'Revisión mensual',
      consumedAt: new Date('2026-02-01'),
      authorId: doctorUser1.doctor!.id,
      patientId: patientUser1.patient!.id,
      items: [
        { name: 'Omeprazol 20mg', dosage: '1 cápsula en ayunas', quantity: 30, instructions: 'Tomar 30 min antes del desayuno' },
      ],
    },
    {
      code: 'RX-2026-005',
      status: 'pending' as const,
      notes: 'Tratamiento respiratorio',
      authorId: doctorUser2.doctor!.id,
      patientId: patientUser1.patient!.id,
      items: [
        { name: 'Salbutamol inhalador', dosage: '2 puffs cada 6 horas', quantity: 1, instructions: 'Usar con espaciador' },
        { name: 'Budesonida 200mcg', dosage: '1 puff cada 12 horas', quantity: 1, instructions: 'Enjuagar boca después de uso' },
      ],
    },
    {
      code: 'RX-2026-006',
      status: 'pending' as const,
      notes: 'Dolor lumbar crónico',
      authorId: doctorUser2.doctor!.id,
      patientId: patientUser2.patient!.id,
      items: [
        { name: 'Naproxeno 550mg', dosage: '1 tableta cada 12 horas', quantity: 14, instructions: 'Tomar con alimentos' },
        { name: 'Ciclobenzaprina 10mg', dosage: '1 tableta al acostarse', quantity: 7, instructions: 'Puede causar somnolencia' },
      ],
    },
    {
      code: 'RX-2026-007',
      status: 'consumed' as const,
      notes: 'Infección urinaria',
      consumedAt: new Date('2026-02-20'),
      authorId: doctorUser1.doctor!.id,
      patientId: patientUser2.patient!.id,
      items: [
        { name: 'Ciprofloxacino 500mg', dosage: '1 tableta cada 12 horas', quantity: 14, instructions: 'Completar el tratamiento' },
      ],
    },
    {
      code: 'RX-2026-008',
      status: 'pending' as const,
      notes: 'Suplementación vitamínica',
      authorId: doctorUser2.doctor!.id,
      patientId: patientUser1.patient!.id,
      items: [
        { name: 'Vitamina D3 1000UI', dosage: '1 tableta al día', quantity: 30, instructions: 'Tomar con la comida' },
        { name: 'Hierro 100mg', dosage: '1 tableta al día', quantity: 30, instructions: 'No tomar con lácteos' },
        { name: 'Ácido fólico 5mg', dosage: '1 tableta al día', quantity: 30, instructions: 'Tomar en ayunas' },
      ],
    },
  ];

  for (const rx of prescriptions) {
    const { items, ...data } = rx;
    await prisma.prescription.create({
      data: {
        ...data,
        items: { create: items },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
