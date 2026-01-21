import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  constructor(private readonly httpService: HttpService) {}

  async fetchData(token: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
    return response.data;
  }
}
