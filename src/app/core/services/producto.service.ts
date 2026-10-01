import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ProductoSelector {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  fabricType: string;
  composition: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPage {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProductRequest {
  code: string;
  name: string;
  fabricType: string;
  composition: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = '/api/v1/products';

  constructor(
    private http: HttpClient
  ) {}

  listar(
    code = '',
    name = '',
    fabricType = '',
    active: boolean | null = null,
    page = 0,
    size = 20
  ): Observable<ApiResponse<ProductPage>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (code.trim()) {
      params = params.set('code', code.trim());
    }

    if (name.trim()) {
      params = params.set('name', name.trim());
    }

    if (fabricType.trim()) {
      params = params.set('fabricType', fabricType.trim());
    }

    if (active !== null) {
      params = params.set('active', active);
    }

    return this.http.get<ApiResponse<ProductPage>>(
      this.apiUrl,
      { params }
    );
  }

  obtenerPorId(
    id: number
  ): Observable<ApiResponse<Product>> {

    return this.http.get<ApiResponse<Product>>(
      `${this.apiUrl}/${id}`
    );
  }

  crear(
    request: ProductRequest
  ): Observable<ApiResponse<Product>> {

    return this.http.post<ApiResponse<Product>>(
      this.apiUrl,
      request
    );
  }

  actualizar(
    id: number,
    request: ProductRequest
  ): Observable<ApiResponse<Product>> {

    return this.http.put<ApiResponse<Product>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  cambiarEstado(
    id: number,
    active: boolean
  ): Observable<ApiResponse<Product>> {

    return this.http.patch<ApiResponse<Product>>(
      `${this.apiUrl}/${id}/status`,
      { active }
    );
  }

  obtenerProductosParaSelector(): Observable<ProductoSelector[]> {

    const params = new HttpParams()
      .set('page', 0)
      .set('size', 100)
      .set('active', true);

    return this.http
      .get<ApiResponse<ProductPage>>(
        this.apiUrl,
        { params }
      )
      .pipe(
        map(response =>
          response.data.content.map(producto => ({
            id: producto.id,
            name: producto.name
          }))
        )
      );
  }
}