import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AnalyticsArea = 'sales' | 'inventory' | 'purchases' | 'customers';
export interface AnalyticsFilters {
  from: string;
  to: string;
  limit: number;
  rankingBy?: string;
  type?: string;
  segment?: string;
  supplierId?: number | null;
  productId?: number | null;
  warehouseId?: number | null;
}
export interface AnalyticsResponse {
  from?: string;
  to?: string;
  hasData?: boolean;
  summary?: Record<string, unknown>;
  customers?: Record<string, unknown>[];
  suppliers?: Record<string, unknown>[];
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AnaliticaService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/analytics';

  dashboard(area: AnalyticsArea, filters: AnalyticsFilters): Observable<AnalyticsResponse> {
    let params = new HttpParams()
      .set('from', filters.from)
      .set('to', filters.to)
      .set('limit', String(filters.limit));
    const extras: Record<string, string | number | null | undefined> = {
      rankingBy: filters.rankingBy,
      type: filters.type,
      segment: filters.segment,
      supplierId: filters.supplierId,
      productId: filters.productId,
      warehouseId: filters.warehouseId
    };
    for (const [key, value] of Object.entries(extras)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<AnalyticsResponse>(`${this.base}/${area}/dashboard`, { params });
  }
}
