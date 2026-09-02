import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngresoService } from '../../../core/services/income.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ingreso, IngresoKPIs, CreateIngresoPayload, UpdateIngresoPayload, CategoriaIngreso, TipoComprobante, EstadoIngreso } from '../../../core/models/income.model';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.css']
})
export class IngresosComponent implements OnInit {
  private ingresoService = inject(IngresoService);
  private authService = inject(AuthService);

  ingresos = signal<Ingreso[]>([]);
  kpis = signal<IngresoKPIs>({
    totalIngresosBrutos: 0,
    previsionImpuestos: 0,
    retencionesIgss: 0,
    ingresoNetoReal: 0,
  });

  loading = signal(false);
  error = signal<string | null>(null);

  isAdmin = signal(false);

  // Modal
  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  form = signal<CreateIngresoPayload>({
    clienteOrigen: '',
    categoria: 'SERVICIOS',
    montoBruto: 0,
    fecha: new Date().toISOString().split('T')[0],
    tipoComprobante: 'FACTURA',
    estado: 'PAGADO',
  });

  // Confirmación de anulación
  showAnularConfirm = signal(false);
  anularId = signal<string | null>(null);

  categorias: CategoriaIngreso[] = ['SERVICIOS', 'PLANILLA', 'PRODUCTOS', 'CONSULTORIA', 'OTROS'];
  comprobantes: TipoComprobante[] = ['FACTURA', 'SALARIO'];
  estados: EstadoIngreso[] = ['PAGADO', 'PENDIENTE'];

  ngOnInit(): void {
    this.isAdmin.set(this.authService.currentUser()?.role === 'ADMIN');
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ingresoService.listar().subscribe({
      next: (res) => {
        this.ingresos.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar ingresos');
        this.loading.set(false);
      },
    });

    this.ingresoService.obtenerKPIs().subscribe({
      next: (res) => this.kpis.set(res.data),
      error: () => { /* KPIs fallan silenciosamente o manejar error */ },
    });
  }

  onCategoriaChange(nuevaCategoria: CategoriaIngreso): void {
    let tipoComp: TipoComprobante = this.form().tipoComprobante;

    if (nuevaCategoria === 'PLANILLA') {
      tipoComp = 'SALARIO';
    } else if (['SERVICIOS', 'PRODUCTOS', 'CONSULTORIA'].includes(nuevaCategoria)) {
      tipoComp = 'FACTURA';
    }

    this.form.update(f => ({
      ...f,
      categoria: nuevaCategoria,
      tipoComprobante: tipoComp
    }));
  }

  openCreate(): void {
    if (!this.isAdmin()) return;
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.set({
      clienteOrigen: '',
      categoria: 'SERVICIOS',
      montoBruto: 0,
      fecha: new Date().toISOString().split('T')[0],
      tipoComprobante: 'FACTURA',
      estado: 'PAGADO',
    });
    this.showModal.set(true);
  }

  openEdit(ing: Ingreso): void {
    if (!this.isAdmin()) return;
    this.isEditing.set(true);
    this.editingId.set(ing.id);
    this.form.set({
      clienteOrigen: ing.clienteOrigen,
      categoria: ing.categoria,
      montoBruto: ing.montoBruto,
      fecha: ing.fecha.split('T')[0],
      tipoComprobante: ing.tipoComprobante,
      estado: ing.estado,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  save(): void {
    if (!this.isAdmin()) return;

    const payload = this.form();
    if (payload.montoBruto <= 0) {
      this.error.set('El monto bruto debe ser mayor a 0');
      return;
    }

    if (payload.categoria === 'PLANILLA' && payload.tipoComprobante !== 'SALARIO') {
      this.error.set('Los registros de PLANILLA deben ser obligatoriamente de tipo SALARIO.');
      return;
    }

    if (['SERVICIOS', 'PRODUCTOS', 'CONSULTORIA'].includes(payload.categoria) && payload.tipoComprobante !== 'FACTURA') {
      this.error.set('Los registros comerciales/servicios deben ser obligatoriamente de tipo FACTURA.');
      return;
    }

    if (this.isEditing() && this.editingId()) {
      this.ingresoService.actualizar(this.editingId()!, payload as UpdateIngresoPayload).subscribe({
        next: () => {
          this.closeModal();
          this.cargarDatos();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al actualizar'),
      });
    } else {
      this.ingresoService.crear(payload).subscribe({
        next: () => {
          this.closeModal();
          this.cargarDatos();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al crear'),
      });
    }
  }

  confirmAnular(id: string): void {
    if (!this.isAdmin()) return;
    this.anularId.set(id);
    this.showAnularConfirm.set(true);
  }

  cancelAnular(): void {
    this.showAnularConfirm.set(false);
    this.anularId.set(null);
  }

  doAnular(): void {
    if (!this.isAdmin() || !this.anularId()) return;
    this.ingresoService.anular(this.anularId()!).subscribe({
      next: () => {
        this.cancelAnular();
        this.cargarDatos();
      },
      error: (err) => this.error.set(err.error?.message || 'Error al anular'),
    });
  }

  formatMoney(value: number): string {
    return 'Q ' + value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  estadoClass(estado: EstadoIngreso): string {
    switch (estado) {
      case 'PAGADO': return 'badge-pagado';
      case 'PENDIENTE': return 'badge-pendiente';
      case 'ANULADO': return 'badge-anulado';
      default: return '';
    }
  }
}