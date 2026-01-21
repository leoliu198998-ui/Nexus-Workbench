import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchData(token: string): Promise<any> {
    const apiUrl = this.configService.get<string>('EXTERNAL_API_URL');
    if (!apiUrl) {
      throw new Error('EXTERNAL_API_URL is not configured');
    }

    const response = await firstValueFrom(
      this.httpService.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
    return response.data;
  }
}
