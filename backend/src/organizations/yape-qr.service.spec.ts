import { BadRequestException } from '@nestjs/common';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { YapeQrService } from './yape-qr.service';

describe('YapeQrService', () => {
  let uploadRoot: string;
  let service: YapeQrService;

  beforeEach(async () => {
    uploadRoot = await mkdtemp(join(tmpdir(), 'pmodular-yape-qr-'));
    service = new YapeQrService({ get: () => uploadRoot } as any);
  });

  afterEach(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
  });

  it('stores a valid PNG under a generated organization-scoped URL', async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);

    const result = await service.save('organization-id', png);

    expect(result.url).toMatch(/^\/uploads\/yape-qr\/organization-id\/[\w-]+\.png$/);
    const savedImage = await readFile(join(uploadRoot, result.url.replace(/^\/uploads\//, '')));
    expect(savedImage).toEqual(png);
  });

  it('stores a valid JPEG with a jpg extension', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);

    const result = await service.save('organization-id', jpeg);

    expect(result.url).toMatch(/\.jpg$/);
  });

  it('rejects files that are not PNG or JPEG images', async () => {
    await expect(service.save('organization-id', Buffer.from('not an image')))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});