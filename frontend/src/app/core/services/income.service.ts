import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ingreso, IngresoKPIs, CreateIngresoPayload, UpdateIngresoPayload } from '../models/income.model';

@Injectable({
  providedIn: 'root',
})
export class IngresoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ingresos`;

  listar(): Observable<{ success: boolean; data: Ingreso[] }> {
    return this.http.get<{ success: boolean; data: Ingreso[] }>(this.apiUrl);
  }

  obtenerKPIs(): Observable<{ success: boolean; data: IngresoKPIs }> {
    return this.http.get<{ success: boolean; data: IngresoKPIs }>(`${this.apiUrl}/kpis`);
  }

  crear(payload: CreateIngresoPayload): Observable<{ success: boolean; data: Ingreso }> {
    return this.http.post<{ success: boolean; data: Ingreso }>(this.apiUrl, payload);
  }

  actualizar(id: string, payload: UpdateIngresoPayload): Observable<{ success: boolean; data: Ingreso }> {
    return this.http.put<{ success: boolean; data: Ingreso }>(`${this.apiUrl}/${id}`, payload);
  }

  anular(id: string): Observable<{ success: boolean; data: Ingreso }> {
    return this.http.patch<{ success: boolean; data: Ingreso }>(`${this.apiUrl}/${id}/anular`, {});
  }
}