import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { RegistroComponent, MoldePayload, MoldeParte } from './registro/registro.component';
import jsPDF from 'jspdf';

interface Molde {
  id_molde: string;
  nombre: string;
  descripcion?: string | null;
  observaciones?: string | null;
  imagen_original?: string | null;
  preview_blanco_negro?: string | null;
  preview_sin_fondo?: string | null;
  partes: MoldeParte[];
  configuracion?: {
    grayscaleSelected?: boolean;
    removeBackground?: boolean;
    thresholdValue?: number;
    minArea?: number;
    print?: {
      paperFormat?: 'a4' | 'letter' | 'legal';
      orientation?: 'portrait' | 'landscape';
      posterHeightCm?: number;
      bwOpacityPercent?: number;
      miniWidthCm?: number;
      miniHeightCm?: number;
      quantity?: number;
      marginCm?: number;
      gapCm?: number;
    };
  };
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Component({
  selector: 'app-moldes',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    RegistroComponent,
    NzGridModule,
    NzInputModule,
    NzModalModule,
    NzMessageModule,
    DatePipe,
  ],
  templateUrl: './moldes.component.html',
  styleUrl: './moldes.component.css'
})
export class MoldesComponent implements OnInit {
  private readonly moldesSecurityCode = 'RIKY-MOLDES-2026';
  private readonly maxSecurityAttempts = 3;
  private readonly lockMinutes = 15;
  private readonly securityAttemptsKey = 'riky_moldes_security_attempts';
  private readonly securityLockUntilKey = 'riky_moldes_security_lock_until';

  showRegistro = false;
  moldes: Molde[] = [];
  moldeParaEditar: Molde | null = null;
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.cargarMoldes();
  }

  cargarMoldes(): void {
    this.apiService.get<Molde[]>('moldes').subscribe({
      next: (data) => {
        this.moldes = data;
      },
      error: (error) => console.error('Error al cargar moldes:', error),
    });
  }

  openRegistro(molde?: Molde) {
    if (this.showRegistro) {
      return;
    }
    this.showRegistro = true;
    this.moldeParaEditar = molde ? { ...molde } : null;
  }

  closeRegistro() {
    this.showRegistro = false;
    this.moldeParaEditar = null;
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible && this.showRegistro) {
      this.closeRegistro();
    }
  }

  async onSubmitRegistro(payload: MoldePayload) {
    try {
      const minimizedPayload = await this.minimizePayload(payload);
      const request$ = this.moldeParaEditar?.id_molde
        ? this.apiService.put(`moldes/${this.moldeParaEditar.id_molde}`, minimizedPayload)
        : this.apiService.post('moldes', minimizedPayload);

      request$.subscribe({
        next: () => {
          this.cargarMoldes();
          this.closeRegistro();
          this.message.success('Molde guardado correctamente.');
        },
        error: (error) => {
          console.error('Error al guardar molde:', error);
          if (error?.status === 413) {
            this.message.error('La imagen es demasiado grande. Reduce calidad o dimensiones antes de guardar.');
            return;
          }
          this.message.error('No se pudo guardar el molde.');
        },
      });
    } catch (error) {
      console.error('Error preparando payload de molde:', error);
      this.message.error('No se pudo preparar la imagen para guardar.');
    }
  }

  eliminarMolde(id: string) {
    this.apiService.delete(`moldes/${id}`).subscribe({
      next: () => this.cargarMoldes(),
      error: (error) => console.error('Error al eliminar molde:', error),
    });
  }

  async descargarMoldePdf(molde: Molde): Promise<void> {
    if (!this.authorizeProtectedExport()) {
      return;
    }

    const password = this.requestPdfPassword();
    if (password === null) {
      this.message.info('Exportacion cancelada. No se genero el PDF.');
      return;
    }

    const doc = await this.buildPrintablePdf(molde, password);
    const fileName = `molde-${(molde.nombre || 'sin-nombre').replace(/\s+/g, '-').toLowerCase()}.pdf`;
    doc.save(fileName);
    this.message.success('PDF protegido generado correctamente.');
  }

  async imprimirMolde(molde: Molde): Promise<void> {
    if (!this.authorizeProtectedExport()) {
      return;
    }

    const password = this.requestPdfPassword();
    if (password === null) {
      this.message.info('Impresion cancelada. No se genero el PDF protegido.');
      return;
    }

    const doc = await this.buildPrintablePdf(molde, password);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        this.message.info('Vista temporal generada. No se descarga archivo local del molde.');
      };
      printWindow.addEventListener('beforeunload', () => {
        URL.revokeObjectURL(blobUrl);
      });
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 45000);
      return;
    }
    URL.revokeObjectURL(blobUrl);
  }

  private async buildPrintablePdf(molde: Molde, password?: string): Promise<jsPDF> {
    const printCfg = molde.configuracion?.print || {};
    const orientation = printCfg.orientation || 'portrait';
    const format = printCfg.paperFormat || 'a4';
    const posterHeightCm = Math.max(20, Number(printCfg.posterHeightCm ?? 200));
    const bwOpacityPercent = Math.max(10, Math.min(100, Number(printCfg.bwOpacityPercent ?? 100)));
    const thresholdValue = Math.max(0, Math.min(255, Number(molde.configuracion?.thresholdValue ?? 175)));
    const grayscaleSelected = molde.configuracion?.grayscaleSelected ?? true;
    const marginCm = printCfg.marginCm ?? 0.8;

    const docOptions: Record<string, unknown> = {
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format,
    };

    if (password) {
      docOptions['encryption'] = {
        userPassword: password,
        ownerPassword: password,
        userPermissions: ['print'],
      };
    }

    const doc = new jsPDF(docOptions as any);

    const sourceImage = molde.imagen_original || molde.preview_sin_fondo || molde.preview_blanco_negro;
    if (!sourceImage) {
      throw new Error('El molde no tiene imagen para imprimir.');
    }

    const imageData = await this.toDataUrl(sourceImage);
    const processedImageData = await this.toPrintableImageDataUrl(
      imageData,
      grayscaleSelected,
      bwOpacityPercent,
      thresholdValue,
      false
    );
    const sourceImg = await this.loadImageElement(processedImageData);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = marginCm * 10;
    const printableWidth = Math.max(1, pageWidth - margin * 2);
    const printableHeight = Math.max(1, pageHeight - margin * 2);

    const targetPosterHeightMm = posterHeightCm * 10;
    let rows = Math.max(2, Math.round(targetPosterHeightMm / printableHeight));
    if (rows % 2 !== 0) {
      rows += 1;
    }

    const imageAspect = sourceImg.width / sourceImg.height;
    const targetPosterWidthMm = targetPosterHeightMm * imageAspect;
    let cols = Math.max(1, Math.round(targetPosterWidthMm / printableWidth));

    if ((rows * cols) % 2 !== 0) {
      cols += 1;
    }

    const tileWidthPx = sourceImg.width / cols;
    const tileHeightPx = sourceImg.height / rows;
    const tileCanvas = document.createElement('canvas');
    const tileCtx = tileCanvas.getContext('2d');
    if (!tileCtx) {
      throw new Error('No se pudo preparar el recorte de imagen para PDF.');
    }

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const pageIndex = row * cols + col;
        if (pageIndex > 0) {
          doc.addPage(format, orientation === 'landscape' ? 'landscape' : 'portrait');
        }

        const sx = Math.floor(col * tileWidthPx);
        const sy = Math.floor(row * tileHeightPx);
        const sw = Math.ceil((col + 1) * tileWidthPx) - sx;
        const sh = Math.ceil((row + 1) * tileHeightPx) - sy;

        tileCanvas.width = Math.max(1, sw);
        tileCanvas.height = Math.max(1, sh);
        tileCtx.imageSmoothingEnabled = false;
        tileCtx.clearRect(0, 0, tileCanvas.width, tileCanvas.height);
        tileCtx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, tileCanvas.width, tileCanvas.height);

        const tileDataUrl = tileCanvas.toDataURL('image/png');
        doc.addImage(tileDataUrl, 'PNG', margin, margin, printableWidth, printableHeight, undefined, 'FAST');
      }
    }

    // Pagina final: imagen completa
    doc.addPage(format, orientation === 'landscape' ? 'landscape' : 'portrait');
    const fitScale = Math.min(printableWidth / sourceImg.width, printableHeight / sourceImg.height);
    const fullWidth = sourceImg.width * fitScale;
    const fullHeight = sourceImg.height * fitScale;
    const fullX = margin + (printableWidth - fullWidth) / 2;
    const fullY = margin + (printableHeight - fullHeight) / 2;
    doc.addImage(processedImageData, 'PNG', fullX, fullY, fullWidth, fullHeight, undefined, 'FAST');

    // Numeracion solo en paginas con contenido
    this.removeBlankPages(doc);
    this.addPageNumbers(doc);

    return doc;
  }

  private removeBlankPages(doc: jsPDF): void {
    const totalPages = doc.getNumberOfPages();
    for (let page = totalPages; page >= 1; page -= 1) {
      doc.setPage(page);
      const pageInfo = (doc as any).internal.pages?.[page];
      const hasDrawing = Array.isArray(pageInfo) && pageInfo.some((entry: string) => entry && entry.trim() !== '');
      if (!hasDrawing && totalPages > 1) {
        doc.deletePage(page);
      }
    }
  }

  private addPageNumbers(doc: jsPDF): void {
    const totalPages = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFontSize(9);
      doc.text(`Pagina ${page} de ${totalPages}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
    }
  }

  private loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo preparar la imagen del molde para segmentarla.'));
      img.src = src;
    });
  }

  private async toPrintableImageDataUrl(
    src: string,
    grayscaleSelected: boolean,
    bwOpacityPercent: number,
    threshold: number,
    removeBackground: boolean
  ): Promise<string> {
    const img = await this.loadImageElement(src);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo convertir la imagen a blanco y negro para PDF.');
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const opacityFactor = bwOpacityPercent / 100;
    // Reutilizamos threshold como control de contraste para no perder detalle.
    const contrastFactor = 0.8 + (threshold / 255) * 0.8;
    const bg = this.sampleCornerBackground(data, canvas.width, canvas.height);
    const bgTolerance = 28;

    // Paso 1: quitar fondo primero (si esta activado).
    if (removeBackground) {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];
        if (alpha === 0) {
          continue;
        }
        const distance = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
        if (distance <= bgTolerance) {
          data[i + 3] = 0;
        }
      }
    }

    // Paso 2: convertir a escala de grises despues de quitar el fondo.
    if (grayscaleSelected) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) {
          continue;
        }
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * contrastFactor + 128));
        const mixed = Math.round(contrasted * opacityFactor + gray * (1 - opacityFactor));
        data[i] = mixed;
        data[i + 1] = mixed;
        data[i + 2] = mixed;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  private sampleCornerBackground(
    rgba: Uint8ClampedArray,
    width: number,
    height: number
  ): { r: number; g: number; b: number } {
    const points = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
    ];

    let r = 0;
    let g = 0;
    let b = 0;

    for (const [x, y] of points) {
      const idx = (y * width + x) * 4;
      r += rgba[idx];
      g += rgba[idx + 1];
      b += rgba[idx + 2];
    }

    return {
      r: Math.round(r / points.length),
      g: Math.round(g / points.length),
      b: Math.round(b / points.length),
    };
  }

  private toDataUrl(src: string): Promise<string> {
    if (src.startsWith('data:')) {
      return Promise.resolve(src);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen para PDF.'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen del molde.'));
      img.src = src;
    });
  }

  private async minimizePayload(payload: MoldePayload): Promise<MoldePayload> {
    const imagenOriginal = await this.compressDataUrl(payload.imagen_original, 1400, 0.72);
    const previewBn = await this.compressDataUrl(payload.preview_blanco_negro, 1400, 0.7);
    const previewSinFondo = await this.compressDataUrl(payload.preview_sin_fondo, 1400, 0.7);

    return {
      ...payload,
      imagen_original: imagenOriginal,
      preview_blanco_negro: previewBn,
      preview_sin_fondo: previewSinFondo,
      partes: payload.partes.map((parte) => ({
        id: parte.id,
        nombre: parte.nombre,
        selected: parte.selected,
        area: parte.area,
        bounds: parte.bounds,
        preview: '',
      })),
    };
  }

  private compressDataUrl(
    src: string | null,
    maxSidePx: number,
    quality: number
  ): Promise<string | null> {
    if (!src || !src.startsWith('data:image')) {
      return Promise.resolve(src);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxSidePx / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = () => resolve(src);
      img.src = src;
    });
  }

  private requestPdfPassword(): string | null {
    const password = window.prompt('Define una contraseña para proteger este PDF de molde (minimo 6 caracteres):', '');
    if (password === null) {
      return null;
    }

    const clean = password.trim();
    if (clean.length < 6) {
      this.message.warning('La contraseña debe tener al menos 6 caracteres.');
      return null;
    }

    return clean;
  }

  private authorizeProtectedExport(): boolean {
    const lockUntilRaw = localStorage.getItem(this.securityLockUntilKey);
    const lockUntil = lockUntilRaw ? Number(lockUntilRaw) : 0;
    const now = Date.now();

    if (lockUntil && now < lockUntil) {
      const minutesLeft = Math.max(1, Math.ceil((lockUntil - now) / 60000));
      this.message.error(`Exportacion bloqueada por seguridad. Intenta de nuevo en ${minutesLeft} min.`);
      return false;
    }

    const currentAttempts = Number(localStorage.getItem(this.securityAttemptsKey) || 0);
    if (currentAttempts >= this.maxSecurityAttempts) {
      const nextLock = now + this.lockMinutes * 60000;
      localStorage.setItem(this.securityLockUntilKey, String(nextLock));
      localStorage.setItem(this.securityAttemptsKey, '0');
      this.message.error(`Se alcanzaron ${this.maxSecurityAttempts} intentos. Modulo bloqueado por ${this.lockMinutes} min.`);
      return false;
    }

    const code = window.prompt('Ingresa el codigo de seguridad para exportar moldes:', '')?.trim() || '';
    if (code === this.moldesSecurityCode) {
      localStorage.setItem(this.securityAttemptsKey, '0');
      localStorage.removeItem(this.securityLockUntilKey);
      return true;
    }

    const nextAttempts = currentAttempts + 1;
    localStorage.setItem(this.securityAttemptsKey, String(nextAttempts));

    if (nextAttempts >= this.maxSecurityAttempts) {
      const nextLock = now + this.lockMinutes * 60000;
      localStorage.setItem(this.securityLockUntilKey, String(nextLock));
      localStorage.setItem(this.securityAttemptsKey, '0');
      this.message.error(`Codigo incorrecto. Se bloqueo el modulo por ${this.lockMinutes} min.`);
      return false;
    }

    const remaining = this.maxSecurityAttempts - nextAttempts;
    this.message.warning(`Codigo incorrecto. Te quedan ${remaining} intento(s).`);
    return false;
  }

  get filteredMoldes(): Molde[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.moldes;
    }

    return this.moldes.filter((molde) =>
      [
        molde.nombre,
        molde.descripcion || '',
        molde.observaciones || '',
        String(molde.partes?.length || 0),
      ].some((value) => value.toLowerCase().includes(term))
    );
  }
}
