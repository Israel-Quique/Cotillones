import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'; 
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';

export interface Pedidos {
    id_pedidos: number;
    fecha_pedido: string;
    direccion_entrega: string;
    estado_id: number;
    total: number;
    metodo_pago_id: number;
    cliente_id: number;
    comentarios_adicionales: string;
    latitud_entrega: number;
    longitud_entrega: number;
  }

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzDatePickerModule,
        NzButtonModule,
        CommonModule
    ],
    templateUrl: './registro.component.html',
    styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
    @Input() pedidos: Pedidos | null = null;
    @Output() formSubmit = new EventEmitter<FormGroup>();

    registroForm: FormGroup;

    constructor(private fb: FormBuilder, private i18n: NzI18nService, private http: HttpClient, private apiService: ApiService) {
        this.registroForm = this.fb.group({
            id_pedidos: [null],
            fecha_pedido: [null, Validators.required],
            direccion_entrega: ['', Validators.required],
            estado_id: [null, Validators.required],
            total: [null, Validators.required],
            metodo_pago_id: [null, Validators.required],
            cliente_id: [null, Validators.required],
            comentarios_adicionales: [''],
            latitud_entrega: [null],
            longitud_entrega: [null],
        });
    }

    ngOnInit() {
        this.i18n.setLocale({
            ...es_ES,
            DatePicker: {
                ...es_ES.DatePicker,
                lang: {
                    ...es_ES.DatePicker.lang,
                    rangeQuarterPlaceholder: ['Trimestre de inicio', 'Trimestre de fin'],
                },
            },
        });
        if (this.pedidos) {
            this.registroForm.patchValue(this.pedidos);
        }
    }

    onSubmit() {
        if (this.registroForm.valid) {
            this.formSubmit.emit(this.registroForm);
        } else {
            Object.values(this.registroForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }
    }
}
