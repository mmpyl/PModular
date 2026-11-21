import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const service = new ReportsService({} as any);

  it('incluye el día completo cuando la fecha final es YYYY-MM-DD', () => {
    const range = (service as any).getDateRange({ startDate: '2026-10-01', endDate: '2026-10-05' });

    expect(range.startDate.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(range.endDate.toISOString()).toBe('2026-10-05T23:59:59.999Z');
  });

  it('rechaza un inicio posterior al fin del periodo', () => {
    expect(() => (service as any).getDateRange({ startDate: '2026-10-06', endDate: '2026-10-05' }))
      .toThrow(BadRequestException);
  });
});