import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { PdfService } from './pdf.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('prescriptions')
@ApiTags('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(
    private prescriptionsService: PrescriptionsService,
    private pdfService: PdfService,
  ) {}

  @Get()
  @Roles('admin', 'doctor')
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'consumed'] })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'mine', required: false, example: 'true' })
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('order') order?: string,
    @Query('mine') mine?: string,
  ) {
    return this.prescriptionsService.findAll({
      status,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      order,
      mine,
      userId: req.user.sub,
    });
  }

  @Get('me')
  @Roles('patient')
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'consumed'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findMyPrescriptions(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.prescriptionsService.findMyPrescriptions(req.user.sub, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'patient')
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Post()
  @Roles('doctor')
  create(@Req() req: any, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(req.user.sub, dto);
  }

  @Put(':id/consume')
  @Roles('patient')
  consume(@Param('id') id: string, @Req() req: any) {
    return this.prescriptionsService.consume(id, req.user.sub);
  }

  @Delete(':id')
  @Roles('admin', 'doctor')
  delete(@Param('id') id: string) {
    return this.prescriptionsService.delete(id);
  }

  @Get(':id/pdf')
  @Roles('admin', 'doctor', 'patient')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const prescription = await this.prescriptionsService.findOne(id);
    const doc = await this.pdfService.generatePrescriptionPdf(prescription);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="prescription-${prescription.code}.pdf"`,
    });

    doc.pipe(res);
  }
}
