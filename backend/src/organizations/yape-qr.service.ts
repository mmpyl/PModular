import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

@Injectable()
export class YapeQrService {
  constructor(private readonly config: ConfigService) {}

  async save(organizationId: string, buffer: Buffer) {
    const extension = this.getImageExtension(buffer);
    const fileName = `${randomUUID()}.${extension}`;
    const relativeDirectory = join('yape-qr', organizationId);
    const uploadDirectory = resolve(this.config.get<string>('UPLOADS_DIR') ?? join(process.cwd(), 'uploads'));
    const filePath = join(uploadDirectory, relativeDirectory, fileName);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer, { flag: 'wx' });

    return { url: `/uploads/${relativeDirectory.replace(/\\/g, '/')}/${fileName}` };
  }

  private getImageExtension(buffer: Buffer) {
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (isPng) return 'png';
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (isJpeg) return 'jpg';
    throw new BadRequestException('El archivo no es una imagen PNG o JPG válida');
  }
}