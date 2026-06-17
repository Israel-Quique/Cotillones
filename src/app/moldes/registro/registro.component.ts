import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ApiService } from '../../api.service';

export interface MoldeParte {
  id: string;
  nombre: string;
  selected: boolean;
  preview: string;
  area: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MoldePayload {
  nombre: string;
  descripcion: string;
  observaciones: string;
  imagen_original: string | null;
  preview_blanco_negro: string | null;
  preview_sin_fondo: string | null;
  partes: MoldeParte[];
  configuracion: {
    grayscaleSelected: boolean;
    removeBackground: boolean;
    thresholdValue: number;
    minArea: number;
    print: {
      paperFormat: 'a4' | 'letter' | 'legal';
      orientation: 'portrait' | 'landscape';
      posterHeightCm: number;
      bwOpacityPercent: number;
      miniWidthCm: number;
      miniHeightCm: number;
      quantity: number;
      marginCm: number;
      gapCm: number;
    };
  };
}

interface MoldeAnalysisResponse {
  originalPreview: string;
  grayscalePreview: string;
  backgroundRemovedPreview: string | null;
  extractedParts: MoldeParte[];
  config: {
    grayscaleSelected: boolean;
    removeBackground: boolean;
    thresholdValue: number;
    minArea: number;
  };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzIconModule,
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnChanges {
  @Input() moldeParaEditar: any = null;
  @Output() formSubmit = new EventEmitter<MoldePayload>();

  registroForm: FormGroup;
  selectedFile: File | null = null;
  originalPreview: string | null = null;
  grayscalePreview: string | null = null;
  backgroundRemovedPreview: string | null = null;
  isAnalyzing = false;
  analysisElapsedSeconds = 0;
  analysisEstimatedSeconds = 0;
  private analysisTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      observaciones: [''],
      grayscaleSelected: [true],
      removeBackground: [true],
      thresholdValue: [175, [Validators.required, Validators.min(50), Validators.max(240)]],
      minArea: [900, [Validators.required, Validators.min(50)]],
      paperFormat: ['a4', Validators.required],
      orientation: ['portrait', Validators.required],
      posterHeightCm: [200, [Validators.required, Validators.min(20), Validators.max(1000)]],
      bwOpacityPercent: [100, [Validators.required, Validators.min(10), Validators.max(100)]],
      miniWidthCm: [5, [Validators.required, Validators.min(1)]],
      miniHeightCm: [5, [Validators.required, Validators.min(1)]],
      quantity: [12, [Validators.required, Validators.min(1), Validators.max(500)]],
      marginCm: [0.8, [Validators.required, Validators.min(0)]],
      gapCm: [0.3, [Validators.required, Validators.min(0)]],
      partes: this.fb.array([]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moldeParaEditar']) {
      this.patchMoldeData();
    }
  }

  get partesFormArray(): FormArray {
    return this.registroForm.get('partes') as FormArray;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;

    if (!file) {
      this.originalPreview = null;
      this.stopAnalysisTimer();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.originalPreview = reader.result as string;
      this.grayscalePreview = null;
      this.backgroundRemovedPreview = null;
      this.partesFormArray.clear();
      this.analyzeImage();
    };
    reader.readAsDataURL(file);
  }

  analyzeImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isAnalyzing = true;
    this.analysisElapsedSeconds = 0;
    this.analysisEstimatedSeconds = this.getEstimatedSeconds(this.selectedFile.size);
    this.startAnalysisTimer();

    const formData = new FormData();
    formData.append('imagen', this.selectedFile);
    formData.append('grayscaleSelected', String(this.registroForm.value.grayscaleSelected));
    formData.append('removeBackground', String(this.registroForm.value.removeBackground));
    formData.append('thresholdValue', String(this.registroForm.value.thresholdValue));
    formData.append('minArea', String(this.registroForm.value.minArea));

    this.apiService.uploadFile<MoldeAnalysisResponse>('moldes/analyze-image', formData).subscribe({
      next: (response) => {
        this.isAnalyzing = false;
        this.stopAnalysisTimer();
        this.originalPreview = response.originalPreview;
        this.grayscalePreview = response.grayscalePreview;
        this.backgroundRemovedPreview = response.backgroundRemovedPreview;
        this.fillPartes(response.extractedParts);
      },
      error: (error) => {
        this.isAnalyzing = false;
        this.stopAnalysisTimer();
        console.error('Error al analizar imagen del molde:', error);
      },
    });
  }

  removePart(index: number): void {
    this.partesFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const value = this.registroForm.getRawValue();
    const payload: MoldePayload = {
      nombre: value.nombre,
      descripcion: value.descripcion,
      observaciones: value.observaciones,
      imagen_original: this.originalPreview,
      preview_blanco_negro: this.grayscalePreview,
      preview_sin_fondo: this.backgroundRemovedPreview,
      partes: value.partes.filter((parte: MoldeParte) => parte.selected),
      configuracion: {
        grayscaleSelected: value.grayscaleSelected,
        removeBackground: value.removeBackground,
        thresholdValue: value.thresholdValue,
        minArea: value.minArea,
        print: {
          paperFormat: value.paperFormat,
          orientation: value.orientation,
          posterHeightCm: value.posterHeightCm,
          bwOpacityPercent: value.bwOpacityPercent,
          miniWidthCm: value.miniWidthCm,
          miniHeightCm: value.miniHeightCm,
          quantity: value.quantity,
          marginCm: value.marginCm,
          gapCm: value.gapCm,
        },
      },
    };

    this.formSubmit.emit(payload);
  }

  private patchMoldeData(): void {
    this.partesFormArray.clear();
    this.stopAnalysisTimer();
    this.analysisElapsedSeconds = 0;
    this.analysisEstimatedSeconds = 0;

    if (!this.moldeParaEditar) {
      this.registroForm.reset({
        nombre: '',
        descripcion: '',
        observaciones: '',
        grayscaleSelected: true,
        removeBackground: true,
        thresholdValue: 175,
        minArea: 900,
        paperFormat: 'a4',
        orientation: 'portrait',
        posterHeightCm: 200,
        bwOpacityPercent: 100,
        miniWidthCm: 5,
        miniHeightCm: 5,
        quantity: 12,
        marginCm: 0.8,
        gapCm: 0.3,
      });
      this.originalPreview = null;
      this.grayscalePreview = null;
      this.backgroundRemovedPreview = null;
      this.selectedFile = null;
      return;
    }

    this.registroForm.patchValue({
      nombre: this.moldeParaEditar.nombre,
      descripcion: this.moldeParaEditar.descripcion || '',
      observaciones: this.moldeParaEditar.observaciones || '',
      grayscaleSelected: this.moldeParaEditar.configuracion?.grayscaleSelected ?? true,
      removeBackground: this.moldeParaEditar.configuracion?.removeBackground ?? true,
      thresholdValue: this.moldeParaEditar.configuracion?.thresholdValue ?? 175,
      minArea: this.moldeParaEditar.configuracion?.minArea ?? 900,
      paperFormat: this.moldeParaEditar.configuracion?.print?.paperFormat ?? 'a4',
      orientation: this.moldeParaEditar.configuracion?.print?.orientation ?? 'portrait',
      posterHeightCm: this.moldeParaEditar.configuracion?.print?.posterHeightCm ?? 200,
      bwOpacityPercent: this.moldeParaEditar.configuracion?.print?.bwOpacityPercent ?? 100,
      miniWidthCm: this.moldeParaEditar.configuracion?.print?.miniWidthCm ?? 5,
      miniHeightCm: this.moldeParaEditar.configuracion?.print?.miniHeightCm ?? 5,
      quantity: this.moldeParaEditar.configuracion?.print?.quantity ?? 12,
      marginCm: this.moldeParaEditar.configuracion?.print?.marginCm ?? 0.8,
      gapCm: this.moldeParaEditar.configuracion?.print?.gapCm ?? 0.3,
    });

    this.originalPreview = this.moldeParaEditar.imagen_original || null;
    this.grayscalePreview = this.moldeParaEditar.preview_blanco_negro || null;
    this.backgroundRemovedPreview = this.moldeParaEditar.preview_sin_fondo || null;
    this.fillPartes(this.moldeParaEditar.partes || []);
  }

  private fillPartes(partes: MoldeParte[]): void {
    this.partesFormArray.clear();
    partes.forEach((parte) => {
      this.partesFormArray.push(
        this.fb.group({
          id: [parte.id],
          nombre: [parte.nombre, Validators.required],
          selected: [parte.selected !== false],
          preview: [parte.preview],
          area: [parte.area],
          bounds: [parte.bounds],
        })
      );
    });
  }

  get analysisProgressPercent(): number {
    if (!this.analysisEstimatedSeconds) {
      return 0;
    }
    return Math.min(95, Math.round((this.analysisElapsedSeconds / this.analysisEstimatedSeconds) * 100));
  }

  private getEstimatedSeconds(fileSizeBytes: number): number {
    const sizeMb = fileSizeBytes / (1024 * 1024);
    return Math.max(3, Math.min(28, Math.ceil(2 + sizeMb * 6)));
  }

  private startAnalysisTimer(): void {
    this.stopAnalysisTimer();
    this.analysisTimer = setInterval(() => {
      this.analysisElapsedSeconds += 1;
    }, 1000);
  }

  private stopAnalysisTimer(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
  }
}
