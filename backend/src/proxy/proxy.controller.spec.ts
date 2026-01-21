import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

describe('ProxyController', () => {
  let controller: ProxyController;
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: {
            fetchData: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.fetchData with correct token', async () => {
    const dto = { token: 'test-token' };
    const result = { data: 'some data' };
    jest.spyOn(service, 'fetchData').mockResolvedValue(result);

    expect(await controller.fetchData(dto)).toBe(result);
    expect(service.fetchData).toHaveBeenCalledWith(dto.token);
  });
});
