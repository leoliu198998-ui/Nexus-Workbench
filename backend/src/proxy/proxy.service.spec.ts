import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from './proxy.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://api.test.com'),
          },
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch data from external API with provided token', async () => {
    const token = 'test-token';
    const mockData = { id: 1, name: 'Test' };
    const mockResponse: AxiosResponse = {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined
      },
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

    const result = await service.fetchData(token);

    expect(configService.get).toHaveBeenCalledWith('EXTERNAL_API_URL');
    expect(httpService.get).toHaveBeenCalledWith(
      'https://api.test.com',
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
    expect(result).toEqual(mockData);
  });
});
