import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class VoucherArchiveService {
  private readonly logger = new Logger(VoucherArchiveService.name);
  private readonly RETENTION_YEARS = 5;

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Archiva un comprobante electrónico (XML + CDR) después de ser aceptado
   */
  async archiveVoucher(invoiceId: string, xmlContent: string, cdrContent: string): Promise<any> {
    this.logger.log(`Archivando comprobante: ${invoiceId}`);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true },
    });

    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    // Calcular fecha de retención (5 años desde la emisión)
    const retentionUntil = new Date(invoice.issueDate);
    retentionUntil.setFullYear(retentionUntil.getFullYear() + this.RETENTION_YEARS);

    // Calcular hash SHA-256 del XML para integridad
    const xmlHash = this.calculateHash(xmlContent);

    // Idempotencia: si ya existe archivo para el comprobante, actualizarlo
    const existing = await this.prisma.voucherArchive.findUnique({
      where: { invoiceId },
    });

    const archiveData = {
      organizationId: invoice.organizationId,
      xmlContent,
      cdrContent,
      xmlHash,
      retentionUntil,
      archivedBy: invoice.issuedBy,
    };

    const archive = existing
      ? await this.prisma.voucherArchive.update({
          where: { invoiceId },
          data: archiveData,
        })
      : await this.prisma.voucherArchive.create({
          data: { invoiceId, ...archiveData },
        });

    this.logger.log(`Comprobante archivado hasta: ${retentionUntil.toISOString()}`);

    // Registrar auditoría
    await this.auditLogService.create({
      organizationId: invoice.organizationId,
      userId: invoice.issuedBy,
      action: 'OTHER',
      entityType: 'VoucherArchive',
      entityId: archive.id,
      metadata: { event: 'VOUCHER_ARCHIVED', invoiceId, xmlHash, retentionUntil: retentionUntil.toISOString() },
    });

    return archive;
  }

  /**
   * Recupera el XML de un comprobante archivado
   */
  async getXML(invoiceId: string, userId: string): Promise<{ xmlContent: string; hash: string }> {
    this.logger.log(`Recuperando XML para: ${invoiceId}`);

    const archive = await this.prisma.voucherArchive.findFirst({
      where: { invoiceId },
    });

    if (!archive) {
      throw new NotFoundException('Comprobante no archivado');
    }

    // Verificar que no haya expirado la retención
    if (new Date() > archive.retentionUntil) {
      throw new Error('El comprobante ha superado el período de retención de 5 años');
    }

    // Registrar auditoría de acceso
    await this.auditLogService.create({
      organizationId: archive.organizationId,
      userId,
      action: 'OTHER',
      entityType: 'VoucherArchive',
      entityId: archive.id,
      metadata: { event: 'XML_RETRIEVED', invoiceId },
    });

    return {
      xmlContent: archive.xmlContent,
      hash: archive.xmlHash,
    };
  }

  /**
   * Recupera el CDR de un comprobante archivado
   */
  async getCDR(invoiceId: string, userId: string): Promise<string> {
    this.logger.log(`Recuperando CDR para: ${invoiceId}`);

    const archive = await this.prisma.voucherArchive.findFirst({
      where: { invoiceId },
    });

    if (!archive) {
      throw new NotFoundException('Comprobante no archivado');
    }

    // Registrar auditoría
    await this.auditLogService.create({
      organizationId: archive.organizationId,
      userId,
      action: 'OTHER',
      entityType: 'VoucherArchive',
      entityId: archive.id,
      metadata: { event: 'CDR_DOWNLOADED', invoiceId },
    });

    return archive.cdrContent;
  }

  /**
   * Verifica la integridad del XML archivado
   */
  async verifyIntegrity(invoiceId: string): Promise<{ valid: boolean; message: string }> {
    const archive = await this.prisma.voucherArchive.findFirst({
      where: { invoiceId },
    });

    if (!archive) {
      return { valid: false, message: 'Archivo no encontrado' };
    }

    const currentHash = this.calculateHash(archive.xmlContent);
    
    if (currentHash === archive.xmlHash) {
      return { valid: true, message: 'Integridad verificada - archivo no ha sido alterado' };
    } else {
      return { valid: false, message: 'ALERTA: El archivo ha sido modificado o corrupto' };
    }
  }

  /**
   * Lista archivos próximos a expirar (para gestión de retención)
   */
  async getExpiringSoon(daysThreshold: number = 30): Promise<any[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.prisma.voucherArchive.findMany({
      where: {
        retentionUntil: {
          lte: thresholdDate,
        },
      },
      include: {
        invoice: {
          select: {
            series: true,
            correlation: true,
            type: true,
            total: true,
          },
        },
      },
      orderBy: {
        retentionUntil: 'asc',
      },
    });
  }

  /**
   * Calcula hash SHA-256 del contenido
   */
  private calculateHash(content: string): string {
    return `sha256:${crypto.createHash('sha256').update(content, 'utf8').digest('hex')}`;
  }
}
