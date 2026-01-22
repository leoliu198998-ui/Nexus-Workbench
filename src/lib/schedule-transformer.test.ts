import { describe, it, expect } from 'vitest';
import { transformScheduleData } from './schedule-transformer';
import { ScheduleApiItem } from './types/schedule';

describe('Schedule Transformer', () => {
  it('should transform basic fields correctly', () => {
    const input: ScheduleApiItem[] = [{
      id: '123',
      name: 'Test Schedule',
      client: { fullName: 'Test Client', code: 'TC01' },
      entity: { name: 'Test Entity' },
      location: { name: 'Shanghai' },
      serviceType: { name: 'Payroll' },
      serviceModule: { name: 'Calculation' },
      generateStatus: 'Success',
      failureReason: [],
      serviceDeliverContacts: [],
      serviceDeliverLocalProcessContacts: []
    }];

    const result = transformScheduleData(input);

    expect(result[0]).toEqual(expect.objectContaining({
      id: '123',
      name: 'Test Schedule',
      clientName: 'Test Client',
      clientCode: 'TC01',
      entityName: 'Test Entity',
      locationName: 'Shanghai',
      serviceType: 'Payroll',
      serviceModuleName: 'Calculation',
      generateStatus: 'Success',
      failureReason: '',
      globalSD: '',
      localProcessSD: ''
    }));
  });

  it('should handle failure reasons including PUBLIC_HOLIDAY_ERROR with missing locations', () => {
    const input: ScheduleApiItem[] = [{
      id: '1',
      name: 'Error Schedule',
      failureReason: ['PUBLIC_HOLIDAY_ERROR', 'OTHER_ERROR'],
      missingHolidayLocations: [{ name: 'Beijing' }, { name: 'Shenzhen' }],
      // ... other required fields empty/minimal
    } as any];

    const result = transformScheduleData(input);

    expect(result[0].failureReason).toContain('PUBLIC_HOLIDAY_ERROR(Beijing,Shenzhen)');
    expect(result[0].failureReason).toContain('OTHER_ERROR');
  });

  it('should handle PUBLIC_HOLIDAY_ERROR without specific locations', () => {
    const input: ScheduleApiItem[] = [{
      id: '1',
      name: 'Error Schedule',
      failureReason: ['PUBLIC_HOLIDAY_ERROR'],
      missingHolidayLocations: [],
    } as any];

    const result = transformScheduleData(input);

    expect(result[0].failureReason).toBe('PUBLIC_HOLIDAY_ERROR(All)');
  });

  it('should join contact names', () => {
    const input: ScheduleApiItem[] = [{
      id: '1',
      name: 'Contact Schedule',
      serviceDeliverContacts: [{ name: 'Alice' }, { name: 'Bob' }],
      serviceDeliverLocalProcessContacts: [{ name: 'Charlie' }],
    } as any];

    const result = transformScheduleData(input);

    expect(result[0].globalSD).toBe('Alice,Bob');
    expect(result[0].localProcessSD).toBe('Charlie');
  });
});
