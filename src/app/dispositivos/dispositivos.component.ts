import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [TopbarComponent,SidebarComponent],
  templateUrl: './dispositivos.component.html',
  styleUrl: './dispositivos.component.css'
})
export class DispositivosComponent {

}
